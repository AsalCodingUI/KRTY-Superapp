import { guardApiRoute } from "@/shared/lib/utils/security"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/shared/api/supabase/server"
import { canManageByRole } from "@/shared/lib/roles"
import { logError } from "@/shared/lib/utils/logger"
import {
  deleteGoogleCalendarEvent,
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

    const { slotId, action, remove } = (await request.json()) as {
      slotId?: string
      action?: "cancel" | "release"
      remove?: boolean
    }

    if (!slotId || !action) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single()

    const isAdmin = canManageByRole(profile?.role)

    const { data: slot, error: slotError } = await supabase
      .from("one_on_one_slots")
      .select("*")
      .eq("id", slotId)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: "slot_not_found" }, { status: 404 })
    }

    if (action === "cancel" && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (action === "release" && slot.booked_by !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (slot.google_event_id) {
      const accessToken = await getGoogleAccessToken()
      const env = getGoogleEnv()

      if (accessToken && env) {
        const deleted = await deleteGoogleCalendarEvent({
          accessToken,
          calendarId: env.calendarId,
          eventId: slot.google_event_id,
        })

        if (!deleted) {
          logError("Failed to delete Google Calendar event:", {
            slotId,
            googleEventId: slot.google_event_id,
          })
        }
      } else {
        logError("Skipping Google Calendar delete (not connected)", {
          slotId,
          googleEventId: slot.google_event_id,
        })
      }
    }

    if (remove) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      await supabase.from("one_on_one_slots").delete().eq("id", slotId)
      return NextResponse.json({ success: true })
    }

    if (action === "cancel") {
      await supabase
        .from("one_on_one_slots")
        .update({
          status: "cancelled",
          google_event_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", slotId)
    } else {
      await supabase
        .from("one_on_one_slots")
        .update({
          status: "open",
          booked_by: null,
          booked_at: null,
          meeting_url: null,
          google_event_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", slotId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logError("Failed to cancel one-on-one slot:", error)
    return NextResponse.json({ error: "cancel_failed" }, { status: 500 })
  }
}
