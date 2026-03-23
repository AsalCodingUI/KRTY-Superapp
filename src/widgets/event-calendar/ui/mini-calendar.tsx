"use client"

import { cx } from "@/shared/lib/utils"
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
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
    <div className="flex w-full flex-col items-center gap-lg">
      <div className="flex w-full items-center justify-center py-md text-center">
        <p className="text-label-sm text-foreground-secondary">
          {format(currentDate, "dd MMMM yyyy", { locale: id })}
        </p>
      </div>

      <div className="flex w-full max-w-[320px] flex-col gap-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-sm">
          {["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"].map((day, index) => (
            <div
              key={`${day}-${index}`}
              className={cx(
                "text-label-sm text-foreground-secondary flex size-7 items-center justify-center rounded-md text-center",
                index >= 5 && "bg-surface-neutral-secondary/50",
              )}
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
            const isWeekend = day.getDay() === 0 || day.getDay() === 6

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cx(
                  "text-label-sm flex w-full aspect-square items-center justify-center rounded-md transition-colors",
                  !isCurrentMonth && "text-foreground-disable",
                  isCurrentMonth &&
                  !isSelected &&
                  "text-foreground-secondary hover:bg-surface-state-neutral-light-hover",
                  isCurrentMonth &&
                  !isSelected &&
                  isWeekend &&
                  "bg-surface-neutral-secondary/50",
                  isSelected &&
                  "bg-surface-brand text-foreground-on-color hover:bg-surface-brand",
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
