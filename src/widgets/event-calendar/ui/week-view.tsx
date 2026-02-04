"use client"

import { cx } from "@/shared/lib/utils"
import { format, isSameDay, startOfDay } from "date-fns"
import { id } from "date-fns/locale"
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
  getWeekDays,
} from "./utils"

interface WeekViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (date: Date) => void
  canEdit?: boolean
}

const PIXELS_PER_HOUR = 60
const HOUR_HEIGHT = PIXELS_PER_HOUR

export const WeekView = memo(function WeekView({
  events,
  onEventClick,
  onSlotClick,
  canEdit = true,
}: WeekViewProps) {
  const { currentDate } = useCalendarContext()
  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const timeSlots = useMemo(() => generateTimeSlots(60), []) // Hourly slots - only compute once
  const currentTimePosition = useCurrentTimeIndicator(PIXELS_PER_HOUR)
  const today = new Date()

  return (
    <div className="flex flex-col">
      {/* Header with days */}
      <div className="border-border-border bg-surface sticky top-0 z-10 flex border-b">
        {/* Time column header */}
        <div className="border-border-border w-16 flex-shrink-0 border-r" />

        {/* Day headers */}
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today)
          return (
            <div
              key={day.toISOString()}
              className="border-border-border flex-1 border-r py-3 text-center last:border-r-0"
            >
              <div className="text-content text-label-md">
                <span className={cx(isToday && "text-primary font-semibold")}>
                  {format(day, "d")}
                </span>{" "}
                <span className="text-content-muted">
                  {format(day, "EEE", { locale: id })}
                </span>
              </div>
            </div>
          )
        })}
      </div>

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
              if (slot.getMinutes() !== 0) return null // Only show hour labels

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

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(events, day)
            const isToday = isSameDay(day, today)

            return (
              <div
                key={day.toISOString()}
                className="border-border-border relative flex-1 border-r last:border-r-0"
              >
                {/* Time slots */}
                {timeSlots.map((slot) => {
                  const hour = slot.getHours()
                  const minute = slot.getMinutes()
                  const slotDate = new Date(day)
                  slotDate.setHours(hour, minute, 0, 0)

                  return (
                    <DroppableCell
                      key={slot.toISOString()}
                      id={`slot-${day.toISOString()}-${hour}`}
                      className="border-border-border/50 hover:bg-muted/30 h-[var(--height)] cursor-pointer border-b transition-colors"
                      style={
                        {
                          "--height": `${HOUR_HEIGHT}px`,
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
                <div className="pointer-events-none absolute inset-0">
                  {dayEvents.map((event) => {
                    const dayStart = startOfDay(day)
                    const { top, height } = calculateEventPosition(
                      event,
                      dayStart,
                      PIXELS_PER_HOUR,
                    )

                    return (
                      <div
                        key={event.id}
                        className="pointer-events-auto absolute top-[var(--top)] right-1 left-1 h-[var(--height)] overflow-hidden rounded-sm"
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
                            compact
                            showTime={height > 30}
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
                      {
                        "--top": `${currentTimePosition}px`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex items-center">
                      <div className="bg-danger -ml-1 h-2 w-2 rounded-full" />
                      <div className="border-danger flex-1 border-t-2" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
