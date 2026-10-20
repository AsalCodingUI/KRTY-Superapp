import type { CalendarEvent, EventColor } from "./types"

/**
 * Quiet event styling: a tinted block with a colour dot for timed events, a
 * dot alone for all-day and month entries.
 */
export const EVENT_TONE: Record<
  EventColor,
  { dot: string; block: string; title: string }
> = {
  blue: {
    dot: "bg-primary",
    block: "bg-primary/12 hover:bg-primary/18",
    title: "text-primary",
  },
  violet: {
    dot: "bg-primary",
    block: "bg-primary/12 hover:bg-primary/18",
    title: "text-primary",
  },
  cyan: {
    dot: "bg-info",
    block: "bg-info/12 hover:bg-info/18",
    title: "text-info",
  },
  emerald: {
    dot: "bg-success",
    block: "bg-success/12 hover:bg-success/18",
    title: "text-success",
  },
  rose: {
    dot: "bg-destructive",
    block: "bg-destructive/12 hover:bg-destructive/18",
    title: "text-destructive",
  },
  orange: {
    dot: "bg-warning",
    block: "bg-warning/12 hover:bg-warning/18",
    title: "text-warning",
  },
  amber: {
    dot: "bg-warning",
    block: "bg-warning/12 hover:bg-warning/18",
    title: "text-warning",
  },
  neutral: {
    dot: "bg-muted-foreground",
    block: "bg-foreground/[0.06] hover:bg-foreground/10",
    title: "text-foreground",
  },
}

export const toneOf = (color: EventColor) =>
  EVENT_TONE[color] ?? EVENT_TONE.blue

/** All-day, or long enough that it belongs in the all-day strip. */
export function isAllDayEvent(event: CalendarEvent) {
  return (
    Boolean(event.allDay) ||
    event.end.getTime() - event.start.getTime() >= 23 * 60 * 60 * 1000
  )
}
