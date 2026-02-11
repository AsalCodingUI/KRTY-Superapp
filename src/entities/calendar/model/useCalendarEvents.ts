"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { CalendarEvent } from "./types"

/**
 * Hook to fetch calendar events for a date range
 *
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Query result with calendar events
 */
export function useCalendarEvents(startDate: Date, endDate: Date) {
  const supabase = createClient()

  return useQuery({
    queryKey: [
      "calendar-events",
      startDate.toISOString(),
      endDate.toISOString(),
    ],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("start_date", startDate.toISOString())
        .lte("end_date", endDate.toISOString())
        .order("start_date", { ascending: true })

      if (error) throw error

      // Transform database format to CalendarEvent format
      return (data || []).map((event: {
        id: string
        title: string
        description: string | null
        start_date: string
        end_date: string
        color: string | null
        location: string | null
        all_day: boolean | null
        type: string | null
        employee_id: string | null
        rsvp_status: string | null
        organizer: string | null
        is_recurring: boolean | null
        recurrence_rule: unknown | null
      }) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        color: event.color || "neutral",
        location: event.location,
        allDay: event.all_day,
        type: event.type,
        employeeId: event.employee_id,
        rsvpStatus: event.rsvp_status,
        organizer: event.organizer,
        isRecurring: event.is_recurring,
        recurrenceRule: event.recurrence_rule,
      })) as CalendarEvent[]
    },
  })
}

/**
 * Hook to fetch a single calendar event by ID
 *
 * @param eventId - The ID of the event
 * @returns Query result with calendar event
 */
export function useCalendarEvent(eventId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["calendar-event", eventId],
    queryFn: async () => {
      if (!eventId) return null

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single()

      if (error) throw error

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        start: new Date(data.start_date),
        end: new Date(data.end_date),
        color: data.color || "neutral",
        location: data.location,
        allDay: data.all_day,
        type: data.type,
        employeeId: data.employee_id,
        rsvpStatus: data.rsvp_status,
        organizer: data.organizer,
        isRecurring: data.is_recurring,
        recurrenceRule: data.recurrence_rule,
      } as CalendarEvent
    },
    enabled: !!eventId,
  })
}
