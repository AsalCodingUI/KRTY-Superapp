"use client"

import { cx } from "@/shared/lib/utils"
import { format, isSameDay, startOfDay } from "date-fns"
import { memo, useMemo } from "react"
import { useCalendarContext } from "./calendar-context"
import { DraggableEvent } from "./draggable-event"
import { DroppableCell } from "./droppable-cell"
import { EventItem } from "./event-item"
import { useCurrentTimeIndicator } from "./hooks/use-current-time-indicator"
import type { CalendarEvent } from "./types"
import {
  calculateEventPosition,
  generateTimeSlots,
  getEventsForDay,
} from "./utils"

interface DayViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (date: Date) => void
  canEdit?: boolean
}

const PIXELS_PER_HOUR = 60
const HOUR_HEIGHT = PIXELS_PER_HOUR

export const DayView = memo(function DayView({
  events,
  onEventClick,
  onSlotClick,
  canEdit = true,
}: DayViewProps) {
  const { currentDate } = useCalendarContext()
  const timeSlots = useMemo(() => generateTimeSlots(30), []) // 30-minute intervals - only compute once
  const currentTimePosition = useCurrentTimeIndicator(PIXELS_PER_HOUR)
  const today = new Date()
  const isToday = isSameDay(currentDate, today)

  // Filter events for current day using centralized function
  // Includes all-day events and filters timed events by business hours
  const dayEvents = useMemo(
    () => getEventsForDay(events, currentDate),
    [events, currentDate],
  )

  return (
    <div className="bg-surface flex flex-col">
      {/* Header */}

      {/* Time grid */}
      <div
        className="h-[var(--height)]"
        style={
          { "--height": `${24 * PIXELS_PER_HOUR}px` } as React.CSSProperties
        }
      >
        <div className="relative flex">
          {/* Time labels */}
          <div className="border-border-border w-16 flex-shrink-0 border-r">
            {timeSlots.map((slot) => {
              const minute = slot.getMinutes()
              if (minute !== 0) return null // Only show hour labels

              return (
                <div
                  key={slot.toISOString()}
                  className="text-content-muted text-body-xs relative h-[var(--height)] pr-2 text-right"
                  style={
                    { "--height": `${HOUR_HEIGHT}px` } as React.CSSProperties
                  }
                >
                  <span className="absolute -top-2 right-2">
                    {format(slot, "h a")}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Day column */}
          <div className="relative flex-1">
            {/* Time slots */}
            {timeSlots.map((slot) => {
              const hour = slot.getHours()
              const minute = slot.getMinutes()
              const slotDate = new Date(currentDate)
              slotDate.setHours(hour, minute, 0, 0)

              return (
                <DroppableCell
                  key={slot.toISOString()}
                  id={`slot-${currentDate.toISOString()}-${hour}-${minute}`}
                  className={cx(
                    "border-border-border/50 hover:bg-muted/30 h-[var(--height)] cursor-pointer border-b transition-colors",
                    minute === 0 && "border-border-border",
                  )}
                  style={
                    {
                      "--height": `${HOUR_HEIGHT / 2}px`,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="h-full w-full"
                    onClick={() => onSlotClick?.(slotDate)}
                  />
                </DroppableCell>
              )
            })}

            {/* Events */}
            <div className="pointer-events-none absolute inset-0 px-2">
              {dayEvents.map((event) => {
                const dayStart = startOfDay(currentDate)
                const { top, height } = calculateEventPosition(
                  event,
                  dayStart,
                  PIXELS_PER_HOUR,
                )

                return (
                  <div
                    key={event.id}
                    className="pointer-events-auto absolute top-[var(--top)] right-2 left-2 h-[var(--height)]"
                    style={
                      {
                        "--top": `${top}px`,
                        "--height": `${height}px`,
                      } as React.CSSProperties
                    }
                  >
                    <DraggableEvent event={event} disabled={!canEdit}>
                      <EventItem
                        event={event}
                        onClick={() => onEventClick?.(event)}
                        compact={height < 60}
                        showTime
                        className="h-full"
                      />
                    </DraggableEvent>
                  </div>
                )
              })}
            </div>

            {/* Current time indicator */}
            {isToday && (
              <div
                className="pointer-events-none absolute top-[var(--top)] right-0 left-0 z-20"
                style={
                  { "--top": `${currentTimePosition}px` } as React.CSSProperties
                }
              >
                <div className="flex items-center">
                  <div className="bg-danger -ml-1.5 h-3 w-3 rounded-full" />
                  <div className="bg-danger h-0.5 flex-1" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
