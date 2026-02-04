import { createClient } from '@/shared/api/supabase/server'
import { logError } from "@/shared/lib/utils/logger"
import { NextRequest, NextResponse } from "next/server"

/**
 * PATCH /api/calendar/rsvp
 * Update RSVP status for an event
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, status } = body

    if (!eventId || !status) {
      return NextResponse.json(
        { error: "Event ID and status required" },
        { status: 400 },
      )
    }

    if (!["yes", "no", "maybe"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid RSVP status" },
        { status: 400 },
      )
    }

    // Update RSVP status in Supabase
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("calendar_events")
      .update({ rsvp_status: status })
      .eq("id", eventId)
      .select()
      .single()

    if (error) {
      logError("Failed to update RSVP:", error)
      return NextResponse.json(
        { error: "Failed to update RSVP status" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      eventId: data.id,
      rsvpStatus: data.rsvp_status,
    })
  } catch (error) {
    logError("RSVP update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
