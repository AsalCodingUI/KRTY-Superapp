"use client"

import { cx } from "@/shared/lib/utils"
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { id } from "date-fns/locale"
import { useCalendarContext } from "./calendar-context"

export function MiniCalendar() {
  const { currentDate, setCurrentDate, setSelectedDate } = useCalendarContext()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const viewStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const viewEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: viewStart, end: viewEnd })

  const handleDayClick = (day: Date) => {
    setCurrentDate(day)
    setSelectedDate(day)
  }

  return (
    <div className="flex w-full flex-col gap-md">
      <div className="flex items-center py-md">
        <p className="text-label-sm text-foreground-secondary">
          {format(currentDate, "dd MMMM yyyy", { locale: id })}
        </p>
      </div>

      <div className="flex flex-col gap-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-sm">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
            <div
              key={`${day}-${index}`}
              className="text-label-sm text-foreground-secondary flex size-7 items-center justify-center text-center"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-sm">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isSelected = isSameDay(day, currentDate)

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cx(
                  "text-label-sm flex size-7 items-center justify-center rounded-md transition-colors",
                  !isCurrentMonth && "text-foreground-disable",
                  isCurrentMonth &&
                    !isSelected &&
                    "text-foreground-secondary hover:bg-surface-state-neutral-light-hover",
                  isSelected && "bg-surface-brand text-foreground-on-color",
                )}
              >
                {format(day, "d")}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
