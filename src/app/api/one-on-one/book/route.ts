import { guardApiRoute } from "@/shared/lib/utils/security"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/shared/api/supabase/server"
import { logError } from "@/shared/lib/utils/logger"
import {
  createGoogleCalendarEvent,
  getGoogleAccessToken,
  getGoogleEnv,
} from "@/shared/lib/google-calendar"

export async function POST(request: NextRequest) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { slotId } = (await request.json()) as { slotId?: string }
    if (!slotId) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
    }

    const { data: slot, error: claimError } = await supabase
      .from("one_on_one_slots")
      .update({
        status: "booking",
        booked_by: user.id,
        booked_at: new Date().toISOString(),
      })
      .eq("id", slotId)
      .eq("status", "open")
      .select("*")
      .single()

    if (claimError || !slot) {
      return NextResponse.json({ error: "slot_unavailable" }, { status: 409 })
    }

    const { data: employeeProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", user.id)
      .single()

    const { data: organizerProfile } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("id", slot.organizer_id)
      .single()

    const accessToken = await getGoogleAccessToken()
    const env = getGoogleEnv()

    if (!accessToken || !env) {
      await supabase
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
      location: slot.mode === "offline" ? slot.location ?? undefined : undefined,
      start: slot.start_at,
      end: slot.end_at,
      attendees,
      createMeet: slot.mode === "online",
    })

    if (!googleEvent) {
      await supabase
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

    await supabase
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
