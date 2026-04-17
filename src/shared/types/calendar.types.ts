import { Tables, TablesInsert, TablesUpdate } from "./database.types"

// --- Calendar Events (user personal) ---
export type CalendarEventRow = Tables<"calendar_events">
export type CalendarEventInsert = TablesInsert<"calendar_events">
export type CalendarEventUpdate = TablesUpdate<"calendar_events">

// --- Internal Calendar Events (company-wide) ---
export type InternalCalendarEvent = Tables<"internal_calendar_events">
export type InternalCalendarEventInsert = TablesInsert<"internal_calendar_events">
export type InternalCalendarEventUpdate = TablesUpdate<"internal_calendar_events">

// --- One-on-One Slots ---
export type OneOnOneSlot = Tables<"one_on_one_slots">
export type OneOnOneSlotInsert = TablesInsert<"one_on_one_slots">
export type OneOnOneSlotUpdate = TablesUpdate<"one_on_one_slots">
