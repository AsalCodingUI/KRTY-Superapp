"use client"

import { isSameDay } from "date-fns"
import { useCalendarContext } from "./calendar-context"
import { EventItem } from "./event-item"
import type { CalendarEvent } from "./types"

interface AgendaViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
  const { currentDate } = useCalendarContext()

  // Filter events for current date
  const dayEvents = events
    .filter((event) => isSameDay(event.start, currentDate))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  return (
    <div className="bg-surface flex h-full flex-col">
      {/* Header */}

      {/* Event count */}
      <div className="text-body-xs text-content-muted px-6 py-3">
        {dayEvents.length} jadwal hari ini
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {dayEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="text-display-lg mb-4">📅</span>
            <p className="text-body-sm text-content-muted">
              Tidak ada jadwal hari ini
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onClick={() => onEventClick?.(event)}
                compact={false}
                showTime
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
