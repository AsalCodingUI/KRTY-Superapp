"use client"

import { cx } from "@/shared/lib/utils"
import { format, isSameDay } from "date-fns"
import { id } from "date-fns/locale"
import { memo, useMemo } from "react"
import { useCalendarContext } from "./calendar-context"
import { DraggableEvent } from "./draggable-event"
import { DroppableCell } from "./droppable-cell"
import { EventItem } from "./event-item"
import { useCurrentTimeIndicator } from "./hooks/use-current-time-indicator"
import type { CalendarEvent } from "./types"
import {
  generateTimeSlots,
  layoutDayEvents,
  getDayKey,
  groupEventsByDay,
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
  const weekRangeStart = weekDays[0]
  const weekRangeEnd = weekDays[weekDays.length - 1]
  const eventsByDay = useMemo(
    () => groupEventsByDay(events, weekRangeStart, weekRangeEnd),
    [events, weekRangeStart, weekRangeEnd],
  )

  return (
    <div className="flex min-w-[720px] flex-col">
      {/* Header with days */}
      <div className="border-border bg-sidebar sticky top-0 z-10 flex border-b">
        {/* Time column header */}
        <div className="border-border w-12 flex-shrink-0 border-r sm:w-16" />

        {/* Day headers */}
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today)
          const isWeekend = day.getDay() === 0 || day.getDay() === 6
          return (
            <div
              key={day.toISOString()}
              className={cx(
                "border-border min-w-[96px] flex-1 border-r py-2 text-center last:border-r-0",
                isWeekend && "bg-muted/50",
              )}
            >
              <div className="text-muted-foreground flex items-center justify-center gap-0.5 text-sm font-medium">
                <span className={cx(isToday && "text-primary font-semibold")}>
                  {format(day, "d")}
                </span>
                <span className="text-muted-foreground/70">
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
          <div className="border-border w-12 flex-shrink-0 border-r sm:w-16">
            {timeSlots.map((slot) => {
              if (slot.getMinutes() !== 0) return null // Only show hour labels

              const baseStyle = {
                "--height": `${HOUR_HEIGHT}px`,
              } as React.CSSProperties

              if (slot.getHours() === 0) {
                return (
                  <div
                    key={slot.toISOString()}
                    className="h-[var(--height)]"
                    style={baseStyle}
                  />
                )
              }

              return (
                <div
                  key={slot.toISOString()}
                  className="text-muted-foreground/70 relative h-[var(--height)] pr-2 text-right text-xs font-medium"
                  style={baseStyle}
                >
                  <span className="bg-sidebar absolute -top-2 right-2 px-1">
                    {format(slot, "HH:mm")}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayEvents = eventsByDay.get(getDayKey(day)) ?? []
            const isToday = isSameDay(day, today)
            const isWeekend = day.getDay() === 0 || day.getDay() === 6

            return (
              <div
                key={day.toISOString()}
                className={cx(
                  "border-border relative min-w-[96px] flex-1 border-r last:border-r-0",
                  isWeekend && "bg-muted/50",
                )}
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
                      className="border-border hover:bg-accent h-[var(--height)] cursor-pointer border-b transition-colors"
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
                  {layoutDayEvents(dayEvents, day, PIXELS_PER_HOUR).map(
                    ({ event, top, height, lane, lanes }) => (
                      <div
                        key={event.id}
                        className="pointer-events-auto absolute top-[var(--top)] left-[var(--left)] h-[var(--height)] w-[var(--width)] overflow-hidden rounded-sm px-0.5"
                        style={
                          {
                            "--top": `${top}px`,
                            "--height": `${height}px`,
                            "--left": `calc(${(lane / lanes) * 100}% + 2px)`,
                            "--width": `calc(${100 / lanes}% - 4px)`,
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
                    ),
                  )}
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
                      <div className="bg-destructive -ml-1 h-2 w-2 rounded-full" />
                      <div className="border-destructive flex-1 border-t-2" />
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
