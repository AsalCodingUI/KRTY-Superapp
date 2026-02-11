"use server"

import { createClient } from "@/shared/api/supabase/server"
import { CalendarEvent } from "../model/types"

/**
 * Fetch calendar events for a date range
 *
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of calendar events
 */
export async function getCalendarEvents(
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("start_date", startDate.toISOString())
    .lte("end_date", endDate.toISOString())
    .order("start_date", { ascending: true })

  if (error) {
    console.error("Error fetching calendar events:", error)
    throw error
  }

  // Transform database format to CalendarEvent format
  return (data || []).map((event: {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    color: string | null;
    location: string | null;
    all_day: boolean | null;
    type: string | null;
    employee_id: string | null;
    rsvp_status: string | null;
    organizer: string | null;
    is_recurring: boolean | null;
    recurrence_rule: unknown | null;
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
}

/**
 * Fetch a single calendar event by ID
 *
 * @param eventId - The ID of the event
 * @returns Calendar event data or null if not found
 */
export async function getCalendarEvent(
  eventId: string,
): Promise<CalendarEvent | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single()

  if (error) {
    console.error("Error fetching calendar event:", error)
    return null
  }

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
}
