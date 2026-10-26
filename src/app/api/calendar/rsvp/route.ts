import { getT } from "@/shared/i18n/server"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { logError } from "@/shared/lib/utils/logger"
import { NextRequest, NextResponse } from "next/server"
import { guardApiRoute } from "@/shared/lib/utils/security"

/**
 * PATCH /api/calendar/rsvp
 * Update RSVP status for an event
 */
export async function PATCH(request: NextRequest) {
  const t = await getT("api")
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 401 })
    }

    const body = await request.json()
    const { eventId, status } = body

    if (!eventId || !status) {
      return NextResponse.json(
        { error: t("rsvpFieldsRequired") },
        { status: 400 },
      )
    }

    if (!["yes", "no", "maybe"].includes(status)) {
      return NextResponse.json(
        { error: t("rsvpInvalidStatus") },
        { status: 400 },
      )
    }

    // Only the owner or a guest (by id or email) answers; guests can't edit
    // events (RLS), so the answer itself is written server-side.
    const admin = createAdminClient()
    const { data: event } = await admin
      .from("calendar_events")
      .select("id, user_id, guests")
      .eq("id", eventId)
      .maybeSingle()
    const guests = (Array.isArray(event?.guests) ? event.guests : []) as (
      | string
      | { id?: string; email?: string }
    )[]
    const invited =
      event?.user_id === user.id ||
      guests.some((g) =>
        typeof g === "string"
          ? g === user.id || g === user.email
          : g?.id === user.id || (!!user.email && g?.email === user.email),
      )
    if (!event || !invited) {
      return NextResponse.json({ error: t("unauthorized") }, { status: 403 })
    }

    const { data, error } = await admin
      .from("calendar_events")
      .update({ rsvp_status: status })
      .eq("id", eventId)
      .select()
      .single()

    if (error) {
      logError("Failed to update RSVP:", error)
      return NextResponse.json(
        { error: t("rsvpUpdateFailed") },
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
    return NextResponse.json({ error: t("serverError") }, { status: 500 })
  }
}
