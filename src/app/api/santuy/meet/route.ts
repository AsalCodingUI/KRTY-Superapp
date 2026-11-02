import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/shared/api/supabase/server"
import { accessLevel } from "@/shared/config/access"
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getGoogleAccessToken,
  getGoogleEnv,
  updateGoogleCalendarEvent,
} from "@/shared/lib/google-calendar"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import {
  nextWeekday,
  sessionTimes,
  todayIn,
  type SantuySettings,
} from "@/shared/lib/santuy"
import { logError } from "@/shared/lib/utils/logger"
import { guardApiRoute } from "@/shared/lib/utils/security"

const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]

type Body =
  /** Make a new weekly Meet event (replacing the old one, if any). */
  | { action: "google" }
  /** Use a pasted link (or none); drops the Google event we made. */
  | { action: "manual"; url: string }
  /** Move our Google event to the current weekday/time. */
  | { action: "sync" }

/**
 * The Sharing Santuy Meet link. One weekly recurring event on the studio
 * Google calendar carries the Meet room; it has no attendees and Google
 * emails nobody (sendUpdates=none). Stakeholders and PMs only.
 */
export async function POST(request: NextRequest) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    const viewerId = await resolveEffectiveUserId(supabase, user.id, user.email)
    const { data: viewer } = await supabase
      .from("profiles")
      .select("role, job_title")
      .eq("id", viewerId)
      .maybeSingle()
    if (accessLevel(viewer) === "employee")
      return NextResponse.json({ error: "forbidden" }, { status: 403 })

    const body = (await request.json().catch(() => null)) as Body | null
    if (!body || !["google", "manual", "sync"].includes(body.action))
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 })

    const { data: row } = await supabase
      .from("santuy_settings")
      .select("*")
      .maybeSingle()
    if (!row)
      return NextResponse.json({ error: "not_set_up" }, { status: 404 })

    const env = getGoogleEnv()
    const token = env ? await getGoogleAccessToken() : null
    const settings: SantuySettings = {
      weekday: row.weekday,
      startTime: row.start_time,
      durationMin: row.duration_min,
      timezone: row.timezone,
      anchorDate: row.anchor_date,
      anchorIndex: row.anchor_index,
    }
    // The series starts at the next session day; the room is the same
    // every week, so only weekday and time matter.
    const first = nextWeekday(todayIn(settings.timezone), settings.weekday)
    const { start, end } = sessionTimes(first, settings)
    const recurrence = [`RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[settings.weekday]}`]

    const dropOld = async () => {
      if (!row.google_event_id || !env || !token) return
      await deleteGoogleCalendarEvent({
        accessToken: token,
        calendarId: env.calendarId,
        eventId: row.google_event_id,
        sendUpdates: "none",
      })
    }

    const save = async (patch: {
      meet_url: string | null
      google_event_id: string | null
    }) => {
      const { error } = await supabase
        .from("santuy_settings")
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq("id", true)
      if (error) throw error
    }

    if (body.action === "manual") {
      const url = body.url?.trim() ?? ""
      if (url && !/^https:\/\/\S+$/i.test(url))
        return NextResponse.json({ error: "invalid_url" }, { status: 400 })
      await dropOld()
      await save({ meet_url: url || null, google_event_id: null })
      return NextResponse.json({ meetUrl: url || null })
    }

    if (!env || !token)
      return NextResponse.json(
        { error: "calendar_not_connected" },
        { status: 400 },
      )

    if (body.action === "sync") {
      if (!row.google_event_id) return NextResponse.json({ synced: false })
      const updated = await updateGoogleCalendarEvent({
        accessToken: token,
        calendarId: env.calendarId,
        eventId: row.google_event_id,
        start: start.toISOString(),
        end: end.toISOString(),
        recurrence,
        timeZone: settings.timezone,
        sendUpdates: "none",
      })
      return NextResponse.json({ synced: !!updated })
    }

    const created = await createGoogleCalendarEvent({
      accessToken: token,
      calendarId: env.calendarId,
      summary: "Sharing Santuy",
      description:
        "Sesi sharing mingguan Kretya Studio. Siapa yang sharing tiap minggu ada di superapp (Kalender → Sharing Santuy).",
      start: start.toISOString(),
      end: end.toISOString(),
      attendees: [],
      createMeet: true,
      recurrence,
      timeZone: settings.timezone,
      sendUpdates: "none",
    })
    const meetUrl =
      created?.hangoutLink ||
      created?.conferenceData?.entryPoints?.find((e) =>
        e.uri?.startsWith("https://meet.google.com"),
      )?.uri
    if (!created || !meetUrl) {
      if (created)
        await deleteGoogleCalendarEvent({
          accessToken: token,
          calendarId: env.calendarId,
          eventId: created.id,
          sendUpdates: "none",
        })
      return NextResponse.json(
        { error: "calendar_create_failed" },
        { status: 502 },
      )
    }
    await dropOld()
    await save({ meet_url: meetUrl, google_event_id: created.id })
    return NextResponse.json({ meetUrl })
  } catch (error) {
    logError("Sharing Santuy Meet link failed:", error)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
