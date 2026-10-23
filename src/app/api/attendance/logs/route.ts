import { getT } from "@/shared/i18n/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import {
  ATTENDANCE_NOTE_TAGS,
  mergeAttendanceNote,
} from "@/shared/lib/attendance"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { differenceInMinutes, format } from "date-fns"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

function getLocalDateString() {
  return format(new Date(), "yyyy-MM-dd")
}

const postSchema = z.object({
  action: z.literal("clock_in"),
  status: z.string().trim().min(1),
})

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("clock_out"),
    logId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("toggle_break"),
    logId: z.string().uuid(),
    isBreak: z.boolean(),
  }),
  z.object({
    action: z.literal("resolve_previous_session"),
    logId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("request_delete"),
    logId: z.string().uuid(),
  }),
])

async function getCanonicalProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, profile: null }
  }

  const profile = await resolveProfileByUserIdOrEmail<{
    id: string
    email: string | null
  }>(supabase, "id, email, created_at", user.id, user.email)

  return { user, profile }
}

/** Thrown below; mapped to a translated message in the handlers. */
const LOG_NOT_FOUND = "Attendance log not found"

async function getOwnedLogOrThrow(
  adminSupabase: ReturnType<typeof createAdminClient>,
  logId: string,
  ownerId: string,
) {
  const { data: log, error } = await adminSupabase
    .from("attendance_logs")
    .select("id, user_id, break_start, break_total, notes")
    .eq("id", logId)
    .maybeSingle()

  if (error) throw error
  if (!log || log.user_id !== ownerId) {
    throw new Error(LOG_NOT_FOUND)
  }

  return log
}

export async function POST(request: NextRequest) {
  const t = await getT("api")
  try {
    const { user, profile } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: t("profileNotFound") }, { status: 404 })
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = postSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidRequest") }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const now = new Date()
    const { data, error } = await adminSupabase
      .from("attendance_logs")
      .insert({
        user_id: profile.id,
        date: getLocalDateString(),
        clock_in: now.toISOString(),
        status: parsed.data.status,
        clock_out: null,
        is_break: false,
        break_total: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Attendance POST error", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : t("attendanceSaveFailed"),
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest) {
  const t = await getT("api")
  try {
    const { user, profile } = await getCanonicalProfile()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }
    if (!profile) {
      return NextResponse.json({ error: t("profileNotFound") }, { status: 404 })
    }

    const rawBody = await request.json().catch(() => null)
    const parsed = patchSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: t("invalidRequest") }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    if (parsed.data.action === "clock_out") {
      await getOwnedLogOrThrow(adminSupabase, parsed.data.logId, profile.id)

      const now = new Date().toISOString()
      const { data, error } = await adminSupabase
        .from("attendance_logs")
        .update({ clock_out: now, is_break: false })
        .eq("id", parsed.data.logId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    if (parsed.data.action === "toggle_break") {
      const currentLog = await getOwnedLogOrThrow(
        adminSupabase,
        parsed.data.logId,
        profile.id,
      )

      if (parsed.data.isBreak) {
        const breakStart = currentLog.break_start
          ? new Date(currentLog.break_start)
          : new Date()
        const duration = differenceInMinutes(new Date(), breakStart)
        const breakTotal = (currentLog.break_total || 0) + duration

        const { data, error } = await adminSupabase
          .from("attendance_logs")
          .update({
            is_break: false,
            break_start: null,
            break_total: breakTotal,
          })
          .eq("id", parsed.data.logId)
          .select()
          .single()

        if (error) throw error
        return NextResponse.json({ success: true, data })
      }

      const { data, error } = await adminSupabase
        .from("attendance_logs")
        .update({
          is_break: true,
          break_start: new Date().toISOString(),
        })
        .eq("id", parsed.data.logId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    if (parsed.data.action === "request_delete") {
      const ownedLog = await getOwnedLogOrThrow(
        adminSupabase,
        parsed.data.logId,
        profile.id,
      )

      const { data, error } = await adminSupabase
        .from("attendance_logs")
        .update({
          // Keep existing tags (e.g. an admin edit) instead of overwriting.
          notes: mergeAttendanceNote(
            ownedLog.notes,
            ATTENDANCE_NOTE_TAGS.deleteRequested,
          ),
        })
        .eq("id", parsed.data.logId)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, data })
    }

    const currentLog = await getOwnedLogOrThrow(
      adminSupabase,
      parsed.data.logId,
      profile.id,
    )

    const now = new Date().toISOString()
    const { data, error } = await adminSupabase
      .from("attendance_logs")
      .update({
        clock_out: now,
        is_break: false,
        break_start: null,
        notes: mergeAttendanceNote(
          currentLog.notes,
          ATTENDANCE_NOTE_TAGS.staleSessionResolved,
        ),
      })
      .eq("id", parsed.data.logId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Attendance PATCH error", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message === LOG_NOT_FOUND
              ? t("attendanceLogNotFound")
              : error.message
            : t("attendanceUpdateFailed"),
      },
      { status: 500 },
    )
  }
}
