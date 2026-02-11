"use client"

import { createClient } from "@/shared/api/supabase/client"
import {
  CalendarProvider,
  type CalendarEvent,
  type EventCategory,
  type EventColor,
  getAllEventTypes,
  getEventTypeDefinition,
} from "@/widgets/event-calendar"
import { GoogleCalendarProvider } from "@/widgets/event-calendar/ui/google-calendar-context"
import { Database } from "@/shared/types/database.types"
import { canManageByRole } from "@/shared/lib/roles"
import { useMemo, useState } from "react"
import { endOfDay, startOfDay } from "date-fns"
import { toast } from "sonner"
import useSWR from "swr"
import { CalendarContent } from "./CalendarContent"

type CalendarEventRow = Database["public"]["Tables"]["calendar_events"]["Row"]
type CalendarEventInsert =
  Database["public"]["Tables"]["calendar_events"]["Insert"]
type CalendarEventRowLite = Pick<
  CalendarEventRow,
  | "id"
  | "title"
  | "description"
  | "start_at"
  | "end_at"
  | "color"
  | "location"
  | "all_day"
  | "meeting_url"
  | "guests"
  | "reminders"
  | "rsvp_status"
  | "organizer"
  | "event_type"
  | "user_id"
  | "is_recurring"
  | "recurrence_rule"
>
type LeaveRequestCalendarRow = Pick<
  Database["public"]["Tables"]["leave_requests"]["Row"],
  "id" | "start_date" | "end_date" | "leave_type" | "status" | "reason" | "user_id"
> & {
  profiles?:
    | { full_name?: string | null }
    | { full_name?: string | null }[]
    | null
}
type OneOnOneCalendarRow = Pick<
  Database["public"]["Tables"]["one_on_one_slots"]["Row"],
  | "id"
  | "start_at"
  | "end_at"
  | "status"
  | "cycle_name"
  | "meeting_url"
  | "location"
  | "mode"
  | "organizer_id"
  | "booked_by"
  | "google_event_id"
  | "updated_at"
> & {
  organizer?:
    | { full_name?: string | null; email?: string | null }
    | { full_name?: string | null; email?: string | null }[]
    | null
  booked_by_profile?:
    | { full_name?: string | null; email?: string | null }
    | { full_name?: string | null; email?: string | null }[]
    | null
}

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

const mapRowToEvent = (row: CalendarEventRowLite): CalendarEvent => {
  const typeDefinition = getEventTypeDefinition(row.event_type ?? undefined)
  const resolvedColor = typeDefinition?.color
    ? typeDefinition.color
    : isEventColor(row.color)
      ? row.color
      : "blue"

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    color: resolvedColor,
    location: row.location ?? undefined,
    allDay: row.all_day ?? false,
    meetingUrl: row.meeting_url ?? undefined,
    guests: (row.guests as unknown as CalendarEvent["guests"]) ?? undefined,
    reminders:
      (row.reminders as unknown as CalendarEvent["reminders"]) ?? undefined,
    rsvpStatus: (row.rsvp_status as CalendarEvent["rsvpStatus"]) ?? undefined,
    organizer: row.organizer ?? undefined,
    type: typeDefinition?.value ?? row.event_type ?? undefined,
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
  if (eventData.color) {
    payload.color = eventData.color
  } else if (eventData.type) {
    const typeDefinition = getEventTypeDefinition(eventData.type)
    if (typeDefinition) {
      payload.color = typeDefinition.color
    }
  }
  if (eventData.location !== undefined) payload.location = eventData.location
  if (eventData.allDay !== undefined) payload.all_day = eventData.allDay
  if (eventData.meetingUrl !== undefined)
    payload.meeting_url = eventData.meetingUrl
  if (eventData.type !== undefined) payload.event_type = eventData.type
  if (eventData.organizer !== undefined) payload.organizer = eventData.organizer
  if (eventData.guests !== undefined)
    payload.guests =
      eventData.guests as unknown as CalendarEventInsert["guests"]
  if (eventData.reminders !== undefined)
    payload.reminders =
      eventData.reminders as unknown as CalendarEventInsert["reminders"]
  if (eventData.rsvpStatus !== undefined)
    payload.rsvp_status = eventData.rsvpStatus
  if (eventData.isRecurring !== undefined)
    payload.is_recurring = eventData.isRecurring
  if (eventData.recurrenceRule !== undefined)
    payload.recurrence_rule = eventData.recurrenceRule

  return payload
}

const mapLeaveRowToEvent = (row: LeaveRequestCalendarRow): CalendarEvent => {
  const leaveType = row.leave_type || "Cuti"
  const normalizedType = leaveType.toLowerCase().includes("wfh")
    ? "WFH"
    : "Cuti"
  const typeDefinition = getEventTypeDefinition(normalizedType)
  const profile =
    Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  const employeeName = profile?.full_name || "Employee"
  const startDate = startOfDay(new Date(row.start_date))
  const endDate = endOfDay(new Date(row.end_date))
  const reason = row.reason?.trim()

  return {
    id: `leave-${row.id}`,
    title: `${employeeName} • ${leaveType}`,
    description: reason ? `Reason: ${reason}` : undefined,
    start: startDate,
    end: endDate,
    allDay: true,
    color: typeDefinition?.color ?? "rose",
    type: normalizedType,
    employeeId: row.user_id,
  }
}

const mapSlotToEvent = (slot: OneOnOneCalendarRow): CalendarEvent | null => {
  if (slot.status !== "booked" && slot.status !== "cancelled") return null
  const typeDefinition = getEventTypeDefinition("301 Meeting")
  const organizerProfile = Array.isArray(slot.organizer)
    ? slot.organizer[0]
    : slot.organizer
  const bookedProfile = Array.isArray(slot.booked_by_profile)
    ? slot.booked_by_profile[0]
    : slot.booked_by_profile
  const organizerName =
    organizerProfile?.full_name || organizerProfile?.email || "Organizer"
  const employeeName =
    bookedProfile?.full_name || bookedProfile?.email || "Employee"
  const statusLabel =
    slot.status === "cancelled" ? "Cancelled" : "Booked"
  const titleBase = `1:1 Review (${slot.cycle_name})`
  const title =
    slot.status === "cancelled" ? `${titleBase} (Cancelled)` : titleBase
  const detailLines = [
    `Status: ${statusLabel}`,
    `Organizer: ${organizerName}`,
    `Employee: ${employeeName}`,
    `Mode: ${slot.mode}`,
  ]

  if (slot.meeting_url) {
    detailLines.push(`Meeting: ${slot.meeting_url}`)
  }
  if (slot.location) {
    detailLines.push(`Location: ${slot.location}`)
  }

  return {
    id: `perf-${slot.id}`,
    title,
    description: detailLines.join("\n"),
    start: new Date(slot.start_at),
    end: new Date(slot.end_at),
    color: slot.status === "cancelled" ? "neutral" : typeDefinition?.color ?? "amber",
    type: "301 Meeting",
    meetingUrl: slot.meeting_url ?? undefined,
    location: slot.mode === "offline" ? slot.location ?? undefined : slot.meeting_url ?? undefined,
    organizer: organizerName,
    employeeId: slot.booked_by ?? undefined,
    allDay: false,
  }
}

export default function CalendarClient({ role, userId }: CalendarClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [dialogOpen, setDialogOpen] = useState(false)

  const isStakeholder = canManageByRole(role)

  const categories: EventCategory[] = useMemo(() => {
    return getAllEventTypes().map((eventType) => ({
      id: eventType.value.toLowerCase().replace(/\s+/g, "-"),
      name: eventType.label,
      color: eventType.color,
      isActive: true,
    }))
  }, [])

  const { data: events = [], isLoading, mutate } = useSWR(
    "calendar-events",
    async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select(
          "id,title,description,start_at,end_at,color,location,all_day,meeting_url,guests,reminders,rsvp_status,organizer,event_type,user_id,is_recurring,recurrence_rule",
        )

      if (error) {
        throw error
      }
      return (data || []).map(mapRowToEvent)
    },
    {
      revalidateOnFocus: false,
      onError: () => {
        toast.error("Gagal memuat kalender internal")
      },
    },
  )

  const {
    data: leaveRequests = [],
    isLoading: leaveLoading,
  } = useSWR<LeaveRequestCalendarRow[]>(
    userId ? ["calendar-leave", userId, isStakeholder] : null,
    async () => {
      let query = supabase
        .from("leave_requests")
        .select(
          "id,start_date,end_date,leave_type,status,reason,user_id,profiles(full_name)",
        )
        .eq("status", "approved")

      if (!isStakeholder && userId) {
        query = query.eq("user_id", userId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as LeaveRequestCalendarRow[]
    },
    {
      revalidateOnFocus: false,
      onError: () => {
        toast.error("Gagal memuat data cuti")
      },
    },
  )

  const {
    data: oneOnOneSlots = [],
    isLoading: oneOnOneLoading,
  } = useSWR<OneOnOneCalendarRow[]>(
    userId ? ["calendar-1on1", userId, isStakeholder] : null,
    async () => {
      let query = supabase
        .from("one_on_one_slots")
        .select(
          "id,start_at,end_at,status,cycle_name,meeting_url,location,mode,organizer_id,booked_by,google_event_id,updated_at,organizer:profiles!organizer_id(full_name,email),booked_by_profile:profiles!booked_by(full_name,email)",
        )
        .order("start_at", { ascending: true })

      if (!isStakeholder && userId) {
        query = query.or(
          `organizer_id.eq.${userId},booked_by.eq.${userId}`,
        )
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as OneOnOneCalendarRow[]
    },
    {
      revalidateOnFocus: false,
      onError: () => {
        toast.error("Gagal memuat jadwal 1:1")
      },
    },
  )

  const leaveEvents = useMemo(
    () => leaveRequests.map(mapLeaveRowToEvent),
    [leaveRequests],
  )

  const oneOnOneEvents = useMemo(
    () => oneOnOneSlots.map(mapSlotToEvent).filter(Boolean) as CalendarEvent[],
    [oneOnOneSlots],
  )

  const blockedGoogleEventIds = useMemo(
    () =>
      oneOnOneSlots
        .map((slot) => slot.google_event_id)
        .filter((id): id is string => Boolean(id)),
    [oneOnOneSlots],
  )

  const combinedEvents = useMemo(
    () => [...events, ...leaveEvents, ...oneOnOneEvents],
    [events, leaveEvents, oneOnOneEvents],
  )

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
      const typeDefinition = payload.event_type
        ? getEventTypeDefinition(payload.event_type)
        : undefined
      payload.color = typeDefinition?.color ?? "blue"
    }

    const { error } = await supabase
      .from("calendar_events")
      .insert([payload])
    if (error) {
      toast.error("Tambah event gagal")
      return
    }
    toast.success("Event ditambah")
    mutate()
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
    mutate()
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
    mutate()
  }

  return (
    <CalendarProvider>
      <GoogleCalendarProvider>
        <CalendarContent
          events={combinedEvents}
          loading={isLoading || leaveLoading || oneOnOneLoading}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          handleEventAdd={handleEventAdd}
          handleEventUpdate={handleEventUpdate}
          handleEventDelete={handleEventDelete}
          isStakeholder={isStakeholder}
          categories={categories}
          blockedGoogleEventIds={blockedGoogleEventIds}
        />
      </GoogleCalendarProvider>
    </CalendarProvider>
  )
}
