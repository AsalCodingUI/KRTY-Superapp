import { getT } from "@/shared/i18n/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import {
  ATTENDANCE_NOTE_TAGS,
  mergeAttendanceNote,
} from "@/shared/lib/attendance"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { differenceInMinutes } from "date-fns"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const TZ = "Asia/Jakarta"

/** yyyy-MM-dd in WIB, whatever timezone the server runs in. */
function jakartaDate(at: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(at)
}

/** A WIB wall-clock time on a WIB date, as a Date (WIB has no DST). */
function jakartaAt(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`)
}

const postSchema = z.object({
  action: z.literal("clock_in"),
  // Same values as CLOCK_STATUSES in features/attendance-clock.
  status: z.enum(["Present", "Lembur", "Cuti Masuk"]),
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

  // "View as" acts as that person, like the pages and the review API.
  const effectiveUserId = await resolveEffectiveUserId(
    supabase,
    user.id,
    user.email,
  )
  const profile = await resolveProfileByUserIdOrEmail<{
    id: string
    email: string | null
  }>(
    supabase,
    "id, email, created_at",
    effectiveUserId,
    effectiveUserId === user.id ? user.email : null,
  )

  return { user, profile }
}

/** Thrown below; mapped to a translated message in the handlers. */
const LOG_NOT_FOUND = "Attendance log not found"
const LOG_CLOSED = "Attendance log already closed"

async function getOwnedLogOrThrow(
  adminSupabase: ReturnType<typeof createAdminClient>,
  logId: string,
  ownerId: string,
) {
  const { data: log, error } = await adminSupabase
    .from("attendance_logs")
    .select(
      "id, user_id, clock_in, clock_out, status, is_break, break_start, break_total, notes",
    )
    .eq("id", logId)
    .maybeSingle()

  if (error) throw error
  if (!log || log.user_id !== ownerId) {
    throw new Error(LOG_NOT_FOUND)
  }

  return log
}

/** Break minutes including one still running at `at` (closing a session). */
function closedBreakTotal(
  log: {
    is_break: boolean | null
    break_start: string | null
    break_total: number | null
  },
  at: Date,
) {
  const running =
    log.is_break && log.break_start
      ? Math.max(0, differenceInMinutes(at, new Date(log.break_start)))
      : 0
  return (log.break_total || 0) + running
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
    const tLeave = await getT("leave")
    // One open session at a time (a unique index backs this up for races).
    const { data: open, error: openError } = await adminSupabase
      .from("attendance_logs")
      .select("id")
      .eq("user_id", profile.id)
      .is("clock_out", null)
      .limit(1)
    if (openError) throw openError
    if (open && open.length > 0) {
      return NextResponse.json(
        { error: tLeave("errAlreadyClockedIn") },
        { status: 409 },
      )
    }

    const now = new Date()
    const { data, error } = await adminSupabase
      .from("attendance_logs")
      .insert({
        user_id: profile.id,
        date: jakartaDate(now),
        clock_in: now.toISOString(),
        status: parsed.data.status,
        clock_out: null,
        is_break: false,
        break_total: 0,
      })
      .select()
      .single()

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: tLeave("errAlreadyClockedIn") },
        { status: 409 },
      )
    }
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
      const log = await getOwnedLogOrThrow(
        adminSupabase,
        parsed.data.logId,
        profile.id,
      )
      if (log.clock_out) throw new Error(LOG_CLOSED)

      // A break still running ends with the session.
      const now = new Date()
      const { data, error } = await adminSupabase
        .from("attendance_logs")
        .update({
          clock_out: now.toISOString(),
          is_break: false,
          break_start: null,
          break_total: closedBreakTotal(log, now),
        })
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
      if (currentLog.clock_out) throw new Error(LOG_CLOSED)
      // `isBreak` is the state the client saw. If the row is already the
      // other way (double click, a second tab) there is nothing to toggle.
      if (Boolean(currentLog.is_break) !== parsed.data.isBreak) {
        return NextResponse.json({ success: true, data: currentLog })
      }

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
    if (currentLog.clock_out) throw new Error(LOG_CLOSED)

    // A forgotten session closes at the person's cut-off on its own day
    // (same rule as run_auto_clock_out), not "now": that counted the
    // night(s) in between as work (sessions of 40+ hours).
    const { data: pref } = await adminSupabase
      .from("attendance_preferences" as never)
      .select("auto_clock_out_time")
      .eq("user_id", profile.id)
      .maybeSingle()
    const cutoff = (
      (pref as { auto_clock_out_time?: string | null } | null)
        ?.auto_clock_out_time ?? "17:00"
    ).slice(0, 5)
    const clockIn = new Date(currentLog.clock_in)
    const day = jakartaDate(clockIn)
    let closeAt = jakartaAt(day, cutoff)
    if (currentLog.status === "Lembur" || closeAt <= clockIn) {
      closeAt = jakartaAt(day, "23:59")
    }
    const now = new Date()
    if (closeAt > now) closeAt = now

    const { data, error } = await adminSupabase
      .from("attendance_logs")
      .update({
        clock_out: closeAt.toISOString(),
        is_break: false,
        break_start: null,
        break_total: closedBreakTotal(currentLog, closeAt),
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
    if (error instanceof Error && error.message === LOG_CLOSED) {
      const tLeave = await getT("leave")
      return NextResponse.json(
        { error: tLeave("errAlreadyClockedOut") },
        { status: 409 },
      )
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message === LOG_NOT_FOUND
              ? t("attendanceLogNotFound")
              : error.message
            : t("attendanceUpdateFailed"),
      },
      {
        status:
          error instanceof Error && error.message === LOG_NOT_FOUND ? 404 : 500,
      },
    )
  }
}
