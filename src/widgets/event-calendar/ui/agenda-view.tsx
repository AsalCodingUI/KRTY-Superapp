"use client"

import { cx } from "@/shared/lib/utils"
import { isSameDay } from "date-fns"
import { useCalendarContext } from "./calendar-context"
import { getEventColorClasses } from "./event-color-registry"
import type { CalendarEvent } from "./types"

interface AgendaViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

// Format time to 12-hour format
const formatTime12Hour = (date: Date): string => {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? "PM" : "AM"
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
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
            {dayEvents.map((event) => {
              const colorClasses = getEventColorClasses(event.color, "default")

              return (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={cx(
                    "w-full rounded px-3 py-2 text-left transition-colors",
                    colorClasses,
                    "hover:shadow-sm",
                  )}
                >
                  <div className="text-label-md">
                    {event.title || (
                      <span className="text-content-muted italic">
                        (No title)
                      </span>
                    )}
                  </div>
                  <div className="text-body-xs mt-0.5 opacity-70">
                    {event.allDay
                      ? "Sepanjang hari"
                      : `${formatTime12Hour(event.start)} - ${formatTime12Hour(event.end)}`}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
