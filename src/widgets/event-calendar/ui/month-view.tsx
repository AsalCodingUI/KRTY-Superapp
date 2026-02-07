"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui"
import { cx } from "@/shared/lib/utils"
import { format, isSameDay, isSameMonth } from "date-fns"
import { id } from "date-fns/locale"
import { memo, useMemo, useState } from "react"
import { useCalendarContext } from "./calendar-context"
import { EventItem } from "./event-item"
import type { CalendarEvent } from "./types"
import { getEventsForDay, getMonthViewDays } from "./utils"

interface MonthViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDayClick?: (date: Date) => void
}

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

export const MonthView = memo(function MonthView({
  events,
  onEventClick,
  onDayClick,
}: MonthViewProps) {
  const { currentDate, selectedDate } = useCalendarContext()
  const monthDays = useMemo(() => getMonthViewDays(currentDate), [currentDate])
  const today = new Date()
  const [openPopover, setOpenPopover] = useState<string | null>(null)

  // Group days by week for week number display
  const weeks: Date[][] = []
  for (let i = 0; i < monthDays.length; i += 7) {
    weeks.push(monthDays.slice(i, i + 7))
  }

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden">
      {/* Weekday headers */}
      <div className="border-neutral-primary bg-surface flex border-b">
        {/* Week number header (removed) */}

        {/* Day headers */}
        <div className="grid flex-1 grid-cols-7">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="border-neutral-primary text-label-sm text-foreground-secondary border-r py-2 text-center last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar grid with week numbers */}
      <div className="flex flex-1 overflow-hidden">
        {/* Week numbers column */}
        {/* Days grid */}
        <div className="grid flex-1 auto-rows-fr grid-cols-7 overflow-hidden">
          {monthDays.map((day) => {
            const dayEvents = getEventsForDay(events, day)
            const isToday = isSameDay(day, today)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected =
              selectedDate !== null
                ? isSameDay(day, selectedDate)
                : isToday
            const showTodayIndicator = isToday && !isSelected
            const dayKey = day.toISOString()
            const hasMoreEvents = dayEvents.length > 3
            const displayEvents = dayEvents.slice(0, 3)

            return (
              <div
                key={dayKey}
                className={cx(
                  "border-neutral-primary flex flex-col border-r border-b p-2 last:border-r-0",
                  "hover:bg-surface-state-neutral-light-hover cursor-pointer transition-colors",
                )}
                onClick={() => onDayClick?.(day)}
              >
                {/* Day number */}
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cx(
                      "text-label-sm flex h-6 w-6 items-center justify-center rounded-md",
                      isSelected
                        ? "bg-surface-brand text-foreground-on-color"
                        : showTodayIndicator
                          ? "text-foreground-brand font-semibold"
                          : isCurrentMonth
                            ? "text-foreground-primary"
                            : "text-foreground-disable",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Events */}
                <div className="flex-1 space-y-1 overflow-hidden">
                  {displayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="h-auto"
                      onClick={(e) => {
                        e.stopPropagation() // Prevent day click from firing
                        onEventClick?.(event)
                      }}
                    >
                      <EventItem
                        event={event}
                        compact={true}
                        showTime={true}
                        className="w-full"
                      />
                    </div>
                  ))}

                  {/* More events indicator */}
                  {hasMoreEvents && (
                    <Popover
                      open={openPopover === dayKey}
                      onOpenChange={(open) =>
                        setOpenPopover(open ? dayKey : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenPopover(dayKey)
                          }}
                          className="text-label-xs text-content-muted hover:text-content w-full px-2 py-1 text-left"
                        >
                          +{dayEvents.length - 3} lainnya
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-3" align="start">
                        <div className="space-y-2">
                          <h4 className="text-label-md text-content mb-3">
                            {format(day, "EEEE, dd MMMM yyyy", { locale: id })}
                          </h4>
                          <div className="max-h-80 space-y-2 overflow-y-auto">
                            {dayEvents.map((event) => (
                              <EventItem
                                key={event.id}
                                event={event}
                                onClick={() => {
                                  setOpenPopover(null)
                                  onEventClick?.(event)
                                }}
                                compact={false}
                              />
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
