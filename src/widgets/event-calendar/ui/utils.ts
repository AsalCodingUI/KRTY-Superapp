// src/components/event-calendar/utils.ts

import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  areIntervalsOverlapping,
  differenceInMinutes,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns"
import { id } from "date-fns/locale"
import type { CalendarEvent, ViewMode } from "./types"

/**
 * Calendar hours configuration
 * Set to full 24 hours (00:00 - 24:00)
 */
export const CALENDAR_HOURS = {
  START: 0, // 12 AM (midnight)
  END: 24, // 12 AM next day (full 24 hours)
} as const

/**
 * Get the start of the week (Sunday)
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 }) // 0 = Sunday
}

/**
 * Get the end of the week (Saturday)
 */
export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 0 })
}

/**
 * Get all days in a month view (including padding days from prev/next month)
 */
export function getMonthViewDays(date: Date): Date[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const viewStart = getWeekStart(monthStart)
  const viewEnd = getWeekEnd(monthEnd)

  return eachDayOfInterval({ start: viewStart, end: viewEnd })
}

/**
 * Get all days in a week
 */
export function getWeekDays(date: Date): Date[] {
  const weekStart = getWeekStart(date)
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

/**
 * Navigate to next period based on view mode
 */
export function getNextPeriod(date: Date, viewMode: ViewMode): Date {
  switch (viewMode) {
    case "day":
      return addDays(date, 1)
    case "week":
      return addWeeks(date, 1)
    case "month":
      return addMonths(date, 1)
    case "agenda":
      return addWeeks(date, 1)
    default:
      return date
  }
}

/**
 * Navigate to previous period based on view mode
 */
export function getPreviousPeriod(date: Date, viewMode: ViewMode): Date {
  switch (viewMode) {
    case "day":
      return subDays(date, 1)
    case "week":
      return subWeeks(date, 1)
    case "month":
      return subMonths(date, 1)
    case "agenda":
      return subWeeks(date, 1)
    default:
      return date
  }
}

/**
 * Format date range for display
 */
export function formatDateRange(
  start: Date,
  end: Date,
  viewMode: ViewMode,
): string {
  switch (viewMode) {
    case "day":
      return format(start, "EEEE, dd MMMM yyyy", { locale: id })
    case "week":
      if (isSameMonth(start, end)) {
        return `${format(start, "dd", { locale: id })} - ${format(end, "dd MMMM yyyy", { locale: id })}`
      }
      return `${format(start, "dd MMM", { locale: id })} - ${format(end, "dd MMM yyyy", { locale: id })}`
    case "month":
      return format(start, "MMMM yyyy", { locale: id })
    case "agenda":
      return "Agenda"
    default:
      return ""
  }
}

/**
 * Get events for a specific day (for week/day views)
 * Shows all events - no hour filtering
 */
export function getEventsForDay(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = startOfDay(event.start)
    const eventEnd = startOfDay(event.end)
    const targetDay = startOfDay(day)

    // Check if event is on this day
    return (
      isSameDay(eventStart, targetDay) ||
      isSameDay(eventEnd, targetDay) ||
      isWithinInterval(targetDay, { start: eventStart, end: eventEnd })
    )
  })
}

/**
 * Get ALL events for a specific day (for month view - no business hours filter)
 */
export function getEventsForDayAllHours(
  events: CalendarEvent[],
  day: Date,
): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = startOfDay(event.start)
    const eventEnd = startOfDay(event.end)
    const targetDay = startOfDay(day)

    return (
      isSameDay(eventStart, targetDay) ||
      isSameDay(eventEnd, targetDay) ||
      isWithinInterval(targetDay, { start: eventStart, end: eventEnd })
    )
  })
}

/**
 * Calculate event position in time grid (for week/day views)
 * Returns top offset and height in pixels
 * Calculates from midnight (00:00)
 */
export function calculateEventPosition(
  event: CalendarEvent,
  dayStart: Date,
  pixelsPerHour: number = 60,
): { top: number; height: number } {
  // Calculate effective start and end times for this day
  const dayEnd = addMinutes(dayStart, 24 * 60)
  const effectiveStart = event.start < dayStart ? dayStart : event.start
  const effectiveEnd = event.end > dayEnd ? dayEnd : event.end

  // Calculate position relative to the day
  const minutesFromMidnight = differenceInMinutes(effectiveStart, dayStart)
  const duration = differenceInMinutes(effectiveEnd, effectiveStart)

  // If event is completely outside (shouldn't happen with correct filtering), return 0
  if (minutesFromMidnight >= 24 * 60 || duration <= 0) {
    return { top: 0, height: 0 }
  }

  const top = (minutesFromMidnight / 60) * pixelsPerHour
  const height = Math.max((duration / 60) * pixelsPerHour, 20) // Minimum 20px height

  return { top, height }
}

/**
 * Generate time slots for day/week view
 * Full 24 hours (00:00 - 23:30)
 */
export function generateTimeSlots(intervalMinutes: number = 30): Date[] {
  const slots: Date[] = []
  const baseDate = startOfDay(new Date())

  for (let hour = CALENDAR_HOURS.START; hour < CALENDAR_HOURS.END; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      slots.push(addMinutes(baseDate, hour * 60 + minute))
    }
  }

  return slots
}

/**
 * Check if events overlap
 */
export function doEventsOverlap(
  event1: CalendarEvent,
  event2: CalendarEvent,
): boolean {
  return areIntervalsOverlapping(
    { start: event1.start, end: event1.end },
    { start: event2.start, end: event2.end },
  )
}

/**
 * Group overlapping events into columns for better display
 */
export function groupOverlappingEvents(
  events: CalendarEvent[],
): CalendarEvent[][] {
  if (events.length === 0) return []

  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  )
  const columns: CalendarEvent[][] = []

  sorted.forEach((event) => {
    let placed = false

    for (const column of columns) {
      const hasOverlap = column.some((e) => doEventsOverlap(e, event))
      if (!hasOverlap) {
        column.push(event)
        placed = true
        break
      }
    }

    if (!placed) {
      columns.push([event])
    }
  })

  return columns
}

/**
 * Calculate current time position in day view
 * Calculates from midnight (00:00)
 */
export function getCurrentTimePosition(pixelsPerHour: number = 60): number {
  const now = new Date()
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
  return (minutesSinceMidnight / 60) * pixelsPerHour
}

/**
 * Round time to nearest interval
 */
export function roundToNearestInterval(
  date: Date,
  intervalMinutes: number = 30,
): Date {
  const minutes = date.getMinutes()
  const roundedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes
  const result = new Date(date)
  result.setMinutes(roundedMinutes)
  result.setSeconds(0)
  result.setMilliseconds(0)
  return result
}

/**
 * Check if event is multi-day
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  return !isSameDay(event.start, event.end)
}

/**
 * Get event color class
 * @deprecated Use getEventColorClasses from event-color-registry instead
 */
export function getEventColorClass(color: string): string {
  const { getEventColorClasses } = require("./event-color-registry")
  return getEventColorClasses(color, "default")
}

/**
 * Get dot color class for event (used in month view)
 */
export function getEventDotColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500 dark:bg-emerald-600",
    orange: "bg-orange-500 dark:bg-orange-600",
    violet: "bg-violet-500 dark:bg-violet-600",
    blue: "bg-surface-brand dark:bg-surface-brand",
    rose: "bg-rose-500 dark:bg-rose-600",
    amber: "bg-amber-500 dark:bg-amber-600",
    cyan: "bg-cyan-500 dark:bg-cyan-600",
    neutral: "bg-neutral-500 dark:bg-neutral-400",
  }

  return colorMap[color] || colorMap.blue
}
