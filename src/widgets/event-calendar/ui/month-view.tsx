"use client"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { cx } from "@/shared/lib/utils"
import { RiCloseLine } from "@/shared/ui/lucide-icons"
import { format, isSameDay, isSameMonth } from "date-fns"
import { useEffect, memo, useMemo, useState } from "react"
import { useCalendarContext } from "./calendar-context"
import { EventItem } from "./event-item"
import { isAllDayEvent, toneOf } from "./event-tone"
import type { CalendarEvent } from "./types"
import { getDayKey, getMonthViewDays, groupEventsByDay } from "./utils"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"

interface MonthViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDayClick?: (date: Date) => void
}

const MOBILE_DAY_EVENTS_DRAWER_CLASSNAME =
  "z-[82] h-[80vh] overflow-hidden rounded-t-[24px] border-t p-0"

export const MonthView = memo(function MonthView({
  events,
  onEventClick,
  onDayClick,
}: MonthViewProps) {
  const { currentDate, setSelectedDate } = useCalendarContext()
  const t = useT("calendar")
  const dateLocale = useDateLocale()
  const monthDays = useMemo(() => getMonthViewDays(currentDate), [currentDate])
  // Mon–Sun short names from the first grid row (weeks start on Monday).
  const weekdayLabels = monthDays
    .slice(0, 7)
    .map((day) => format(day, "EEE", { locale: dateLocale }))
  const today = new Date()
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileDayDrawerOpen, setMobileDayDrawerOpen] = useState(false)
  const [mobileSelectedDay, setMobileSelectedDay] = useState<Date | null>(null)
  const [mobileSelectedEvents, setMobileSelectedEvents] = useState<
    CalendarEvent[]
  >([])
  const monthRangeStart = monthDays[0]
  const monthRangeEnd = monthDays[monthDays.length - 1]
  const eventsByDay = useMemo(
    () => groupEventsByDay(events, monthRangeStart, monthRangeEnd),
    [events, monthRangeStart, monthRangeEnd],
  )

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 640)
    updateMobile()
    window.addEventListener("resize", updateMobile)
    return () => window.removeEventListener("resize", updateMobile)
  }, [])

  // Group days by week for week number display
  const weeks: Date[][] = []
  for (let i = 0; i < monthDays.length; i += 7) {
    weeks.push(monthDays.slice(i, i + 7))
  }

  const handleDaySelect = (day: Date, dayEvents: CalendarEvent[]) => {
    setSelectedDate(day)

    if (isMobile && dayEvents.length > 0) {
      setMobileSelectedDay(day)
      setMobileSelectedEvents(dayEvents)
      setMobileDayDrawerOpen(true)
      return
    }

    onDayClick?.(day)
  }

  return (
    <>
      <div className="flex h-full w-full max-w-full min-w-[700px] flex-col overflow-hidden">
        {/* Weekday headers */}
        <div className="border-border flex border-b">
          {/* Week number header (removed) */}

          {/* Day headers */}
          <div className="grid flex-1 grid-cols-7">
            {weekdayLabels.map((day) => (
              <div
                key={day}
                className="text-muted-foreground border-r px-2.5 py-2 text-sm last:border-r-0"
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
          <div className="grid flex-1 grid-cols-7 overflow-hidden">
            {monthDays.map((day) => {
              const dayEvents = eventsByDay.get(getDayKey(day)) ?? []
              const isToday = isSameDay(day, today)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const dayKey = day.toISOString()
              const hasMoreEvents = dayEvents.length > 3
              const displayEvents = dayEvents.slice(0, 3)

              return (
                <div
                  key={dayKey}
                  className={cx(
                    "flex min-h-[96px] flex-col border-r border-b p-1.5 sm:min-h-[120px] [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0",
                    isToday && "bg-foreground/[0.025]",
                    "hover:bg-foreground/[0.03] cursor-pointer transition-colors",
                  )}
                  onClick={() => handleDaySelect(day, dayEvents)}
                >
                  {/* Day number */}
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cx(
                        "flex size-6 items-center justify-center rounded-[5px] text-[13px] tabular-nums",
                        isToday
                          ? "bg-foreground text-background font-medium"
                          : isCurrentMonth
                            ? "text-muted-foreground"
                            : "text-muted-foreground/40",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Events - full display on sm+, compact dot indicator on mobile */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {/* Mobile: show colored dots for events */}
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 sm:hidden">
                        {dayEvents.slice(0, 4).map((event) => (
                          <span
                            key={event.id}
                            className="bg-primary size-1.5 rounded-full"
                          />
                        ))}
                        {dayEvents.length > 4 && (
                          <span className="text-tertiary-foreground text-[9px] leading-none">
                            +{dayEvents.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Desktop: show event items */}
                    <div className="hidden space-y-px sm:block">
                      {displayEvents.map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEventClick?.(event)
                          }}
                          className="hover:bg-accent flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-sm px-1 py-0.5 text-left text-[13px]"
                          title={event.title}
                        >
                          <span
                            className={cx(
                              "size-1.5 shrink-0 rounded-full",
                              toneOf(event.color).dot,
                            )}
                          />
                          {!isAllDayEvent(event) && (
                            <span className="text-muted-foreground shrink-0 tabular-nums">
                              {format(event.start, "HH:mm")}
                            </span>
                          )}
                          <span className="truncate">{event.title}</span>
                        </button>
                      ))}

                      {/* More events indicator */}
                      {hasMoreEvents && (
                        <Popover
                          open={openPopover === dayKey}
                          onOpenChange={(open) =>
                            setOpenPopover(open ? dayKey : null)
                          }
                        >
                          <PopoverTrigger
                            render={
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenPopover(dayKey)
                                }}
                                className="text-tertiary-foreground hover:text-foreground w-full px-2 py-1 text-left text-xs font-medium"
                              />
                            }
                          >
                            {t("monthMoreEvents", {
                              count: dayEvents.length - 3,
                            })}
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[min(320px,calc(100vw-2rem))] p-3"
                            align="start"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              <h4 className="text-foreground mb-3 text-sm font-medium">
                                {format(day, "EEEE, dd MMMM yyyy", {
                                  locale: dateLocale,
                                })}
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
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Sheet open={mobileDayDrawerOpen} onOpenChange={setMobileDayDrawerOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className={MOBILE_DAY_EVENTS_DRAWER_CLASSNAME}
        >
          <SheetTitle className="sr-only">
            {mobileSelectedDay
              ? format(mobileSelectedDay, "EEEE, dd MMMM yyyy", {
                  locale: dateLocale,
                })
              : t("monthDayDrawerFallbackTitle")}
          </SheetTitle>
          <div className="border-border flex items-center justify-between border-b px-4 py-4">
            <h3 className="text-heading text-base font-medium">
              {mobileSelectedDay
                ? format(mobileSelectedDay, "EEEE, dd MMMM yyyy", {
                    locale: dateLocale,
                  })
                : t("monthDayDrawerFallbackTitle")}
            </h3>
            <SheetClose
              render={
                <button
                  type="button"
                  className="text-tertiary-foreground hover:text-foreground inline-flex size-8 items-center justify-center rounded-full transition-colors"
                  aria-label={t("monthDayDrawerClose")}
                />
              }
            >
              <RiCloseLine className="size-6" />
            </SheetClose>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-6">
            <div className="space-y-3">
              {mobileSelectedEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("monthDayDrawerEmpty")}
                </p>
              ) : (
                mobileSelectedEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onClick={() => {
                      setMobileDayDrawerOpen(false)
                      onEventClick?.(event)
                    }}
                    compact={false}
                  />
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
})
