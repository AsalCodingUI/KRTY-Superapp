import { NextRequest, NextResponse } from "next/server"
import { logError } from "@/shared/lib/utils/logger"
import { guardApiRoute } from "@/shared/lib/utils/security"
import {
  fetchGoogleCalendarEvents,
  getGoogleAccessToken,
  getGoogleEnv,
  parseGoogleDate,
} from "@/shared/lib/google-calendar"

function mapGoogleStatus(status?: string) {
  if (!status) return "pending"
  if (status === "accepted") return "accepted"
  if (status === "declined") return "declined"
  return "pending"
}

export async function GET(request: NextRequest) {
  const guard = guardApiRoute(request)
  if (guard) return guard

  try {
    const env = getGoogleEnv()
    if (!env) {
      return NextResponse.json(
        { error: "missing_credentials", events: [] },
        { status: 400 },
      )
    }

    const { searchParams } = new URL(request.url)
    const start = searchParams.get("start")
    const end = searchParams.get("end")

    if (!start || !end) {
      return NextResponse.json(
        { error: "missing_range", events: [] },
        { status: 400 },
      )
    }

    const accessToken = await getGoogleAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: "token_exchange_failed", events: [] },
        { status: 401 },
      )
    }

    const items = await fetchGoogleCalendarEvents({
      accessToken,
      calendarId: env.calendarId,
      timeMin: start,
      timeMax: end,
    })

    const events = items
      .map((item) => {
        const startDate = parseGoogleDate(item.start)
        const endDate = parseGoogleDate(item.end)
        if (!startDate || !endDate) return null

        const allDay = Boolean(item.start?.date && !item.start?.dateTime)
        const meetingUrl =
          item.hangoutLink || item.conferenceData?.entryPoints?.[0]?.uri
        const summary = item.summary || "Untitled"
        const summaryLower = summary.toLowerCase()
        const organizerEmail = item.organizer?.email?.toLowerCase() ?? ""
        const isPublicHoliday =
          organizerEmail.includes("holiday") ||
          summaryLower.includes("public holiday") ||
          summaryLower.includes("holiday") ||
          summaryLower.includes("libur")

        return {
          id: `gcal_${item.id}`,
          googleEventId: item.id,
          title: summary,
          description: item.description || undefined,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          allDay,
          color: isPublicHoliday ? "neutral" : "blue",
          location: item.location || undefined,
          organizer: item.organizer?.displayName || item.organizer?.email,
          meetingUrl,
          type: isPublicHoliday ? "Public Holiday" : "google",
          guests: item.attendees?.map((attendee) => ({
            email: attendee.email || "",
            name: attendee.displayName || undefined,
            status: mapGoogleStatus(attendee.responseStatus),
            isOrganizer: attendee.self,
          })),
        }
      })
      .filter(Boolean)

    return NextResponse.json({ events })
  } catch (error) {
    logError("Failed to fetch Google Calendar events:", error)
    return NextResponse.json(
      { error: "fetch_failed", events: [] },
      { status: 500 },
    )
  }
}
