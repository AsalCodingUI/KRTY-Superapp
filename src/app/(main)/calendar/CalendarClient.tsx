"use client"

import { createClient } from "@/shared/api/supabase/client"
import {
  CalendarProvider,
  type CalendarEvent,
  type EventCategory,
  type EventColor,
} from "@/widgets/event-calendar"
import { GoogleCalendarProvider } from "@/widgets/event-calendar/ui/google-calendar-context"
import { Database } from "@/shared/types/database.types"
import { canManageByRole } from "@/shared/lib/roles"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarContent } from "./CalendarContent"

type CalendarEventRow = Database["public"]["Tables"]["calendar_events"]["Row"]
type CalendarEventInsert =
  Database["public"]["Tables"]["calendar_events"]["Insert"]

interface CalendarClientProps {
  role: string
  userId: string | null
}

const EVENT_COLORS: EventColor[] = [
  "emerald",
  "orange",
  "violet",
  "blue",
  "rose",
  "amber",
  "cyan",
  "neutral",
]

const isEventColor = (value: string): value is EventColor =>
  EVENT_COLORS.includes(value as EventColor)

const mapRowToEvent = (row: CalendarEventRow): CalendarEvent => {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    color: isEventColor(row.color) ? row.color : "blue",
    location: row.location ?? undefined,
    allDay: row.all_day ?? false,
    meetingUrl: row.meeting_url ?? undefined,
    guests: (row.guests as CalendarEvent["guests"]) ?? undefined,
    reminders: (row.reminders as CalendarEvent["reminders"]) ?? undefined,
    rsvpStatus: (row.rsvp_status as CalendarEvent["rsvpStatus"]) ?? undefined,
    organizer: row.organizer ?? undefined,
    type: row.event_type ?? undefined,
    employeeId: row.user_id ?? undefined,
    isRecurring: row.is_recurring ?? undefined,
    recurrenceRule: row.recurrence_rule ?? undefined,
  }
}

const mapEventToInsert = (
  eventData: Partial<CalendarEvent>,
): Partial<CalendarEventInsert> => {
  const payload: Partial<CalendarEventInsert> = {}

  if (eventData.title !== undefined) payload.title = eventData.title
  if (eventData.description !== undefined)
    payload.description = eventData.description
  if (eventData.start) payload.start_at = eventData.start.toISOString()
  if (eventData.end) payload.end_at = eventData.end.toISOString()
  if (eventData.color) payload.color = eventData.color
  if (eventData.location !== undefined) payload.location = eventData.location
  if (eventData.allDay !== undefined) payload.all_day = eventData.allDay
  if (eventData.meetingUrl !== undefined)
    payload.meeting_url = eventData.meetingUrl
  if (eventData.type !== undefined) payload.event_type = eventData.type
  if (eventData.organizer !== undefined) payload.organizer = eventData.organizer
  if (eventData.guests !== undefined)
    payload.guests = eventData.guests as CalendarEventInsert["guests"]
  if (eventData.reminders !== undefined)
    payload.reminders = eventData.reminders as CalendarEventInsert["reminders"]
  if (eventData.rsvpStatus !== undefined)
    payload.rsvp_status = eventData.rsvpStatus
  if (eventData.isRecurring !== undefined)
    payload.is_recurring = eventData.isRecurring
  if (eventData.recurrenceRule !== undefined)
    payload.recurrence_rule = eventData.recurrenceRule

  return payload
}

export default function CalendarClient({ role, userId }: CalendarClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const isStakeholder = canManageByRole(role)

  // Mock categories for now or fetch them
  const categories: EventCategory[] = [
    { id: "work", name: "Work", color: "blue", isActive: true },
    { id: "personal", name: "Personal", color: "emerald", isActive: true },
    { id: "urgent", name: "Urgent", color: "amber", isActive: true },
  ]

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    // TODO: Replace with real table fetch
    const { data, error } = await supabase.from("calendar_events").select("*")

    if (error) {
      toast.error("Gagal memuat kalender internal")
      // Fallback to empty if table doesn't exist yet/error
      setEvents([])
    } else {
      const mapped = (data || []).map(mapRowToEvent)
      setEvents(mapped)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleEventAdd = async (eventData: Partial<CalendarEvent>) => {
    const payload = mapEventToInsert(eventData)
    if (userId) {
      payload.user_id = userId
    }
    if (!payload.title || !payload.start_at || !payload.end_at) {
      toast.error("Data event belum lengkap")
      return
    }
    if (!payload.color) {
      payload.color = "blue"
    }

    const { error } = await supabase
      .from("calendar_events")
      .insert([payload])
    if (error) {
      toast.error("Tambah event gagal")
      return
    }
    toast.success("Event ditambah")
    fetchEvents()
    setDialogOpen(false)
  }

  const handleEventUpdate = async (eventData: Partial<CalendarEvent>) => {
    if (!eventData.id) return
    const payload = mapEventToInsert(eventData)
    const { error } = await supabase
      .from("calendar_events")
      .update(payload)
      .eq("id", eventData.id)

    if (error) {
      toast.error("Ubah event gagal")
      return
    }
    toast.success("Event diubah")
    fetchEvents()
    setDialogOpen(false)
  }

  const handleEventDelete = async (eventId: string) => {
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId)
    if (error) {
      toast.error("Hapus event gagal")
      return
    }
    toast.success("Event dihapus")
    fetchEvents()
  }

  return (
    <CalendarProvider>
      <GoogleCalendarProvider>
        <CalendarContent
          events={events}
          loading={loading}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          handleEventAdd={handleEventAdd}
          handleEventUpdate={handleEventUpdate}
          handleEventDelete={handleEventDelete}
          isStakeholder={isStakeholder}
          categories={categories}
        />
      </GoogleCalendarProvider>
    </CalendarProvider>
  )
}
