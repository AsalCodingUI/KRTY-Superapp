const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars"

export interface GoogleCalendarEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  hangoutLink?: string
  organizer?: { email?: string; displayName?: string }
  attendees?: Array<{
    email?: string
    displayName?: string
    responseStatus?: string
    self?: boolean
  }>
  conferenceData?: {
    entryPoints?: Array<{ uri?: string }>
  }
  colorId?: string
}

export function getGoogleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary"

  if (!clientId || !clientSecret || !refreshToken) {
    return null
  }

  return { clientId, clientSecret, refreshToken, calendarId }
}

export async function getGoogleAccessToken(): Promise<string | null> {
  const env = getGoogleEnv()
  if (!env) return null

  const params = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    refresh_token: env.refreshToken,
    grant_type: "refresh_token",
  })

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as { access_token?: string }
  return data.access_token ?? null
}

export async function fetchGoogleCalendarEvents({
  accessToken,
  calendarId,
  timeMin,
  timeMax,
}: {
  accessToken: string
  calendarId: string
  timeMin: string
  timeMax: string
}): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "2500",
  })

  const response = await fetch(
    `${GOOGLE_EVENTS_URL}/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    return []
  }

  const data = (await response.json()) as { items?: GoogleCalendarEvent[] }
  return data.items ?? []
}

export async function createGoogleCalendarEvent({
  accessToken,
  calendarId,
  summary,
  description,
  location,
  start,
  end,
  attendees,
  createMeet,
}: {
  accessToken: string
  calendarId: string
  summary: string
  description?: string
  location?: string
  start: string
  end: string
  attendees: Array<{ email: string; displayName?: string }>
  createMeet: boolean
}): Promise<GoogleCalendarEvent | null> {
  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  const body: Record<string, any> = {
    summary,
    description,
    location,
    start: { dateTime: start, timeZone: "Asia/Jakarta" },
    end: { dateTime: end, timeZone: "Asia/Jakarta" },
    attendees,
  }

  if (createMeet) {
    body.conferenceData = {
      createRequest: {
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    }
  }

  const response = await fetch(
    `${GOOGLE_EVENTS_URL}/${encodeURIComponent(
      calendarId,
    )}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    return null
  }

  return (await response.json()) as GoogleCalendarEvent
}

export async function updateGoogleCalendarEvent({
  accessToken,
  calendarId,
  eventId,
  start,
  end,
  location,
}: {
  accessToken: string
  calendarId: string
  eventId: string
  start: string
  end: string
  location?: string
}): Promise<GoogleCalendarEvent | null> {
  const body: Record<string, any> = {
    start: { dateTime: start, timeZone: "Asia/Jakarta" },
    end: { dateTime: end, timeZone: "Asia/Jakarta" },
    location,
  }

  const response = await fetch(
    `${GOOGLE_EVENTS_URL}/${encodeURIComponent(
      calendarId,
    )}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  )

  if (!response.ok) {
    return null
  }

  return (await response.json()) as GoogleCalendarEvent
}

export async function deleteGoogleCalendarEvent({
  accessToken,
  calendarId,
  eventId,
}: {
  accessToken: string
  calendarId: string
  eventId: string
}): Promise<boolean> {
  const response = await fetch(
    `${GOOGLE_EVENTS_URL}/${encodeURIComponent(
      calendarId,
    )}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  return response.ok
}

export function parseGoogleDate(input?: {
  dateTime?: string
  date?: string
}): Date | null {
  if (!input) return null
  if (input.dateTime) return new Date(input.dateTime)
  if (input.date) return new Date(`${input.date}T00:00:00`)
  return null
}
