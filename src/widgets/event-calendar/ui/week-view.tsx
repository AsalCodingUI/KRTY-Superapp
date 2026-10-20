"use client"

import { cx } from "@/shared/lib/utils"
import { RiAddLine, RiSubtractFill } from "@/shared/ui/lucide-icons"
import { format, isBefore, isSameDay } from "date-fns"
import { id } from "date-fns/locale"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { useCalendarContext } from "./calendar-context"
import { DraggableEvent } from "./draggable-event"
import { DroppableCell } from "./droppable-cell"
import { isAllDayEvent, toneOf } from "./event-tone"
import { useCurrentTimeIndicator } from "./hooks/use-current-time-indicator"
import type { CalendarEvent } from "./types"
import {
  getDayKey,
  getWeekDays,
  groupEventsByDay,
  layoutDayEvents,
  slotId,
} from "./utils"

interface WeekViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (date: Date) => void
  canEdit?: boolean
}

/** Hour heights for the −/+ zoom; 64px matches the reference. */
const HOUR_STEPS = [40, 52, 64, 80, 100, 128]
const DEFAULT_STEP = 2
/** Open scrolled to the working day rather than midnight. */
const FIRST_VISIBLE_HOUR = 7
const ALL_DAY_LIMIT = 4
const HOURS = Array.from({ length: 24 }, (_, h) => h)

function formatRange(event: CalendarEvent) {
  return `${format(event.start, "HH:mm")} – ${format(event.end, "HH:mm")}`
}

export const WeekView = memo(function WeekView({
  events,
  onEventClick,
  onSlotClick,
  canEdit = true,
}: WeekViewProps) {
  const { currentDate } = useCalendarContext()
  const [step, setStep] = useState(DEFAULT_STEP)
  const hourHeight = HOUR_STEPS[step]
  const rootRef = useRef<HTMLDivElement>(null)

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const currentTimePosition = useCurrentTimeIndicator(hourHeight)
  const now = new Date()

  const { allDayByDay, timedByDay } = useMemo(() => {
    const start = weekDays[0]
    const end = weekDays[weekDays.length - 1]
    return {
      allDayByDay: groupEventsByDay(events.filter(isAllDayEvent), start, end),
      timedByDay: groupEventsByDay(
        events.filter((e) => !isAllDayEvent(e)),
        start,
        end,
      ),
    }
  }, [events, weekDays])

  // Scroll the working day into view on open and when zooming.
  useEffect(() => {
    let scroller = rootRef.current?.parentElement ?? null
    while (scroller && getComputedStyle(scroller).overflowY !== "auto") {
      scroller = scroller.parentElement
    }
    scroller?.scrollTo({ top: FIRST_VISIBLE_HOUR * hourHeight })
  }, [hourHeight])

  return (
    <div ref={rootRef} className="flex min-w-[760px] flex-col text-sm">
      {/* Day header + all-day strip (sticky) */}
      <div className="bg-sidebar sticky top-0 z-20 border-b">
        <div className="flex">
          <div className="flex w-14 shrink-0 items-center justify-center gap-0.5 border-r">
            <button
              type="button"
              aria-label="Perkecil"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-5 cursor-pointer items-center justify-center rounded-sm disabled:pointer-events-none disabled:opacity-40"
            >
              <RiSubtractFill className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Perbesar"
              disabled={step === HOUR_STEPS.length - 1}
              onClick={() =>
                setStep((s) => Math.min(HOUR_STEPS.length - 1, s + 1))
              }
              className="text-muted-foreground hover:text-foreground hover:bg-accent flex size-5 cursor-pointer items-center justify-center rounded-sm disabled:pointer-events-none disabled:opacity-40"
            >
              <RiAddLine className="size-3.5" />
            </button>
          </div>
          {weekDays.map((day) => {
            const isToday = isSameDay(day, now)
            return (
              <div
                key={day.toISOString()}
                className={cx(
                  "flex min-w-0 flex-1 items-center gap-1.5 border-r border-dashed px-2.5 py-2 last:border-r-0",
                  isToday && "bg-foreground/[0.025]",
                )}
              >
                <span className="text-muted-foreground">
                  {format(day, "EEE", { locale: id })}
                </span>
                <span
                  className={cx(
                    "tabular-nums",
                    isToday
                      ? "bg-foreground text-background flex size-6 items-center justify-center rounded-[5px] font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
            )
          })}
        </div>

        {/* All-day strip: reminders, leave, multi-day items */}
        <div className="flex">
          <div className="text-muted-foreground flex w-14 shrink-0 items-start justify-end border-r px-2 pt-2 text-[11px]">
            Seharian
          </div>
          {weekDays.map((day) => {
            const items = allDayByDay.get(getDayKey(day)) ?? []
            const isToday = isSameDay(day, now)
            return (
              <div
                key={day.toISOString()}
                className={cx(
                  "flex min-h-14 min-w-0 flex-1 flex-col gap-0.5 border-r border-dashed px-1.5 py-1.5 last:border-r-0",
                  isToday && "bg-foreground/[0.025]",
                )}
              >
                {items.slice(0, ALL_DAY_LIMIT).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => onEventClick?.(event)}
                    className="hover:bg-accent flex min-w-0 cursor-pointer items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-[13px]"
                    title={event.title}
                  >
                    <span
                      className={cx(
                        "size-1.5 shrink-0 rounded-full",
                        toneOf(event.color).dot,
                      )}
                    />
                    <span className="truncate">{event.title}</span>
                  </button>
                ))}
                {items.length > ALL_DAY_LIMIT && (
                  <span className="text-muted-foreground px-1 text-xs">
                    +{items.length - ALL_DAY_LIMIT} lainnya
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Time grid */}
      <div className="relative flex">
        {/* Hour labels */}
        <div className="w-14 shrink-0 border-r">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="text-muted-foreground relative h-[var(--h)] pr-2 text-right text-xs tabular-nums"
              style={{ "--h": `${hourHeight}px` } as React.CSSProperties}
            >
              {hour > 0 && (
                <span className="absolute top-1.5 right-2">
                  {String(hour).padStart(2, "0")}:00
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day) => {
          const isToday = isSameDay(day, now)
          const dayEvents = timedByDay.get(getDayKey(day)) ?? []

          return (
            <div
              key={day.toISOString()}
              className={cx(
                "relative min-w-0 flex-1 border-r border-dashed last:border-r-0",
                isToday && "bg-foreground/[0.025]",
              )}
            >
              {HOURS.map((hour) => {
                const slotDate = new Date(day)
                slotDate.setHours(hour, 0, 0, 0)
                return (
                  <DroppableCell
                    key={hour}
                    id={slotId(day, hour)}
                    className={cx(
                      "h-[var(--h)] border-b border-solid transition-colors",
                      canEdit && "hover:bg-foreground/[0.03] cursor-pointer",
                    )}
                    style={{ "--h": `${hourHeight}px` } as React.CSSProperties}
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
                {layoutDayEvents(dayEvents, day, hourHeight).map(
                  ({ event, top, height, lane, lanes }) => {
                    const tone = toneOf(event.color)
                    const isPast = isBefore(event.end, now)
                    return (
                      <div
                        key={event.id}
                        className="pointer-events-auto absolute top-[var(--top)] left-[var(--left)] h-[var(--height)] w-[var(--width)] p-px"
                        style={
                          {
                            "--top": `${top}px`,
                            "--height": `${Math.max(height, 22)}px`,
                            "--left": `calc(${(lane / lanes) * 100}% + 1px)`,
                            "--width": `calc(${100 / lanes}% - 2px)`,
                          } as React.CSSProperties
                        }
                      >
                        <DraggableEvent event={event} disabled={!canEdit}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEventClick?.(event)
                            }}
                            className={cx(
                              "flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-md px-2 text-left transition-colors",
                              // Short events (< ~30 min) get a tighter line so
                              // the title isn't clipped.
                              height < 30 ? "justify-center py-0" : "py-1",
                              tone.block,
                              isPast && "opacity-60",
                            )}
                          >
                            <span
                              className={cx(
                                "flex min-w-0 items-center gap-1.5 font-medium",
                                height < 30
                                  ? "text-xs leading-4"
                                  : "text-[13px] leading-5",
                              )}
                            >
                              <span
                                className={cx(
                                  "size-1.5 shrink-0 rounded-full",
                                  tone.dot,
                                )}
                              />
                              <span className="truncate">{event.title}</span>
                            </span>
                            {height >= 40 && (
                              <span className="text-muted-foreground truncate pl-3 text-xs tabular-nums">
                                {formatRange(event)}
                              </span>
                            )}
                          </button>
                        </DraggableEvent>
                      </div>
                    )
                  },
                )}
              </div>

              {/* Now line */}
              {isToday && (
                <div
                  className="pointer-events-none absolute top-[var(--top)] right-0 left-0 z-10"
                  style={
                    {
                      "--top": `${currentTimePosition}px`,
                    } as React.CSSProperties
                  }
                >
                  <div className="flex items-center">
                    <div className="bg-destructive -ml-1 size-2 rounded-full" />
                    <div className="bg-destructive h-px flex-1" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})
