import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { canManageByRole } from "@/shared/lib/roles"
import { logError } from "@/shared/lib/utils/logger"
import { guardApiRoute } from "@/shared/lib/utils/security"
import {
  getGoogleAccessToken,
  getGoogleEnv,
  updateGoogleCalendarEvent,
} from "@/shared/lib/google-calendar"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> },
) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const { slotId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await resolveProfileByUserIdOrEmail<{
      id: string
      email: string | null
      role: string | null
    }>(supabase, "id, email, role, created_at", user.id, user.email)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (!canManageByRole(profile?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const adminSupabase = createAdminClient()

    const body = await request.json()
    const {
      date,
      startTime,
      endTime,
      startAt: startAtInput,
      endAt: endAtInput,
    } = body as {
      date?: string
      startTime?: string
      endTime?: string
      startAt?: string
      endAt?: string
    }

    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
    }

    const { data: slot, error: slotError } = await adminSupabase
      .from("one_on_one_slots")
      .select("id, google_event_id, mode, location")
      .eq("id", slotId)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: "slot_not_found" }, { status: 404 })
    }

    const startAt = startAtInput
      ? new Date(startAtInput)
      : new Date(`${date}T${startTime}`)
    const endAt = endAtInput
      ? new Date(endAtInput)
      : new Date(`${date}T${endTime}`)

    if (startAt >= endAt) {
      return NextResponse.json({ error: "invalid_time" }, { status: 400 })
    }

    if (slot.google_event_id) {
      const accessToken = await getGoogleAccessToken()
      const env = getGoogleEnv()
      if (!accessToken || !env) {
        return NextResponse.json(
          { error: "calendar_not_connected" },
          { status: 400 },
        )
      }

      const updatedEvent = await updateGoogleCalendarEvent({
        accessToken,
        calendarId: env.calendarId,
        eventId: slot.google_event_id,
        start: startAt.toISOString(),
        end: endAt.toISOString(),
        location:
          slot.mode === "offline" ? (slot.location ?? undefined) : undefined,
      })

      if (!updatedEvent) {
        return NextResponse.json(
          { error: "calendar_update_failed" },
          { status: 500 },
        )
      }
    }

    const { error: updateError } = await adminSupabase
      .from("one_on_one_slots")
      .update({
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", slotId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logError("Failed to reschedule slot:", error)
    return NextResponse.json({ error: "update_failed" }, { status: 500 })
  }
}
