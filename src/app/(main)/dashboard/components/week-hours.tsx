"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Database } from "@/shared/types/database.types"
import { cn } from "@/lib/utils"
import { formatWorked, workedMs } from "@/shared/lib/attendance"
import {
  getAttendanceLogLocalDate,
  getLocalDateString,
} from "@/shared/lib/date"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { addDays, format, isAfter, startOfWeek } from "date-fns"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

/** A full day's work; a bar at this height is "full". */
const DAY_MS = 8 * 60 * 60_000

/**
 * This week at a glance (Mon–Fri): a slim bar per day, filled by hours
 * worked against a full day, today's labels in the text colour, days still
 * ahead as a dot. The total sits above.
 */
export function WeekHours({ logs, now }: { logs: AttendanceLog[]; now: Date }) {
  const t = useT("dashboard")
  const tl = useT("leave")
  const dateLocale = useDateLocale()
  const monday = startOfWeek(now, { weekStartsOn: 1 })
  const today = getLocalDateString(now)

  const days = Array.from({ length: 5 }, (_, i) => {
    const date = addDays(monday, i)
    const key = getLocalDateString(date)
    const ms = logs
      .filter((log) => log.clock_in && getAttendanceLogLocalDate(log) === key)
      .reduce((sum, log) => sum + workedMs(log, now), 0)
    return { date, key, ms, future: isAfter(date, now) && key !== today }
  })
  const total = days.reduce((sum, d) => sum + d.ms, 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-muted-foreground text-[13px]">
          {t("weekTitle")}
        </span>
        <span className="text-foreground text-[13px] tabular-nums">
          {formatWorked(total, tl("hourShort"))}
        </span>
      </div>
      {/* Slim bars like the Kinerja trend: hours on top, the day below; a
          day still ahead is just a dot. */}
      <div className="flex justify-between px-1">
        {days.map((day) => {
          const isToday = day.key === today
          const fill = Math.min(1, day.ms / DAY_MS)
          return (
            <Tooltip key={day.key}>
              <TooltipTrigger
                render={
                  <div className="flex w-12 flex-col items-center gap-2" />
                }
              >
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    isToday ? "text-foreground" : "text-tertiary-foreground",
                  )}
                >
                  {day.ms > 0 ? formatWorked(day.ms, tl("hourShort")) : "–"}
                </span>
                <div className="flex h-10 items-end">
                  {day.future ? (
                    <span className="bg-foreground/15 size-1.5 rounded-full" />
                  ) : (
                    <div className="bg-muted relative h-full w-1.5 overflow-hidden rounded-full">
                      {day.ms > 0 && (
                        <div
                          className="bar-grow-y bg-blue-9 absolute inset-x-0 bottom-0 rounded-full"
                          style={
                            {
                              "--bar": `${Math.max(12, fill * 100)}%`,
                            } as React.CSSProperties
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[11px]",
                    isToday ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {format(day.date, "EEE", { locale: dateLocale })}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {format(day.date, "EEEE, d MMM", { locale: dateLocale })} ·{" "}
                {day.future
                  ? t("weekAhead")
                  : day.ms > 0
                    ? formatWorked(day.ms, tl("hourShort"))
                    : t("weekNoClockIn")}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
