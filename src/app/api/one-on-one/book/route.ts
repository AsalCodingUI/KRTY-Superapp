import { getT } from "@/shared/i18n/server"
import { guardApiRoute } from "@/shared/lib/utils/security"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { logError } from "@/shared/lib/utils/logger"
import {
  createGoogleCalendarEvent,
  getGoogleAccessToken,
  getGoogleEnv,
} from "@/shared/lib/google-calendar"
import { slotViewer } from "../shared"

export async function POST(request: NextRequest) {
  const t = await getT("api")
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const profile = await slotViewer(supabase)
    if (!profile) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }

    const { slotId } = (await request.json()) as { slotId?: string }
    if (!slotId) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    const { data: target } = await adminSupabase
      .from("one_on_one_slots")
      .select("id, cycle_name, start_at, status")
      .eq("id", slotId)
      .maybeSingle()
    if (!target || target.status !== "open") {
      return NextResponse.json({ error: "slot_unavailable" }, { status: 409 })
    }
    if (new Date(target.start_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "slot_past" }, { status: 409 })
    }
    // One 1:1 per person per quarter, upcoming or already held: release
    // an upcoming one to pick another.
    const { data: held } = await adminSupabase
      .from("one_on_one_slots")
      .select("end_at")
      .eq("booked_by", profile.id)
      .eq("cycle_name", target.cycle_name)
      .in("status", ["booking", "booked"])
    if (held?.length) {
      const done = held.every((s) => new Date(s.end_at).getTime() <= Date.now())
      return NextResponse.json(
        { error: done ? "already_met" : "already_booked" },
        { status: 409 },
      )
    }

    const { data: slot, error: claimError } = await adminSupabase
      .from("one_on_one_slots")
      .update({
        status: "booking",
        booked_by: profile.id,
        booked_at: now,
      })
      .eq("id", slotId)
      .eq("status", "open")
      .select("id, organizer_id, cycle_name, mode, location, start_at, end_at")
      .single()

    if (claimError || !slot) {
      return NextResponse.json({ error: "slot_unavailable" }, { status: 409 })
    }

    const { data: employeeProfile } = await adminSupabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", profile.id)
      .single()

    const { data: organizerProfile } = await adminSupabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", slot.organizer_id)
      .single()

    const accessToken = await getGoogleAccessToken()
    const env = getGoogleEnv()

    if (!accessToken || !env) {
      await adminSupabase
        .from("one_on_one_slots")
        .update({ status: "open", booked_by: null, booked_at: null })
        .eq("id", slotId)
      return NextResponse.json(
        { error: "calendar_not_connected" },
        { status: 400 },
      )
    }

    const attendees = [
      {
        email: employeeProfile?.email || "",
        displayName: employeeProfile?.full_name || undefined,
      },
      {
        email: organizerProfile?.email || "",
        displayName: organizerProfile?.full_name || undefined,
      },
    ].filter((a) => a.email)

    const summary = `1:1 Review (${slot.cycle_name})`
    const description = `1:1 Performance Review for ${employeeProfile?.full_name || "Employee"}`

    const googleEvent = await createGoogleCalendarEvent({
      accessToken,
      calendarId: env.calendarId,
      summary,
      description,
      location:
        slot.mode === "offline" ? (slot.location ?? undefined) : undefined,
      start: slot.start_at,
      end: slot.end_at,
      attendees,
      createMeet: slot.mode === "online",
    })

    if (!googleEvent) {
      await adminSupabase
        .from("one_on_one_slots")
        .update({ status: "open", booked_by: null, booked_at: null })
        .eq("id", slotId)
      return NextResponse.json(
        { error: "calendar_create_failed" },
        { status: 500 },
      )
    }

    const meetingUrl =
      googleEvent.hangoutLink ||
      googleEvent.conferenceData?.entryPoints?.[0]?.uri ||
      null

    await adminSupabase
      .from("one_on_one_slots")
      .update({
        status: "booked",
        meeting_url: meetingUrl,
        google_event_id: googleEvent.id ?? null,
      })
      .eq("id", slotId)

    return NextResponse.json({
      success: true,
      meetingUrl,
      googleEventId: googleEvent.id,
    })
  } catch (error) {
    logError("Failed to book one-on-one slot:", error)
    return NextResponse.json({ error: "book_failed" }, { status: 500 })
  }
}
