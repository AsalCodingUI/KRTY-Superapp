"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui"
import { cx } from "@/shared/lib/utils"
import { RiCloseLine } from "@/shared/ui/lucide-icons"
import { format, isSameDay, isSameMonth } from "date-fns"
import { id } from "date-fns/locale"
import { useEffect, memo, useMemo, useState } from "react"
import { useCalendarContext } from "./calendar-context"
import { EventItem } from "./event-item"
import type { CalendarEvent } from "./types"
import { getDayKey, getMonthViewDays, groupEventsByDay } from "./utils"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/shared/ui/overlay/Drawer"

interface MonthViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onDayClick?: (date: Date) => void
}

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
const MOBILE_DAY_EVENTS_DRAWER_CLASSNAME =
  "top-auto right-0 bottom-0 left-0 z-[82] mx-0 h-[80vh] w-full max-w-none overflow-hidden rounded-t-[24px] rounded-b-none border-x-0 border-b-0 p-0 max-sm:inset-x-0 sm:inset-y-auto sm:top-auto sm:right-0 sm:bottom-0 sm:left-0 sm:h-[80vh] sm:max-w-none sm:w-full sm:p-0 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full"

export const MonthView = memo(function MonthView({
  events,
  onEventClick,
  onDayClick,
}: MonthViewProps) {
  const { currentDate, selectedDate, setSelectedDate } = useCalendarContext()
  const monthDays = useMemo(() => getMonthViewDays(currentDate), [currentDate])
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
      <div className="flex h-full min-w-[700px] w-full max-w-full flex-col overflow-hidden">
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
          <div className="grid flex-1 grid-cols-7 overflow-hidden">
            {monthDays.map((day) => {
              const dayEvents = eventsByDay.get(getDayKey(day)) ?? []
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
                    "border-neutral-primary flex min-h-[96px] flex-col border-r border-b p-1 last:border-r-0 sm:min-h-[120px] sm:p-2",
                    "hover:bg-surface-state-neutral-light-hover cursor-pointer transition-colors",
                  )}
                  onClick={() => handleDaySelect(day, dayEvents)}
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

                  {/* Events - full display on sm+, compact dot indicator on mobile */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {/* Mobile: show colored dots for events */}
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 sm:hidden">
                        {dayEvents.slice(0, 4).map((event) => (
                          <span
                            key={event.id}
                            className="size-1.5 rounded-full bg-surface-brand"
                          />
                        ))}
                        {dayEvents.length > 4 && (
                          <span className="text-foreground-tertiary text-[9px] leading-none">
                            +{dayEvents.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Desktop: show event items */}
                    <div className="hidden sm:block space-y-1">
                      {displayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="h-auto"
                          onClick={(e) => {
                            e.stopPropagation()
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
                          <PopoverContent
                            className="w-[min(320px,calc(100vw-2rem))] p-3"
                            align="start"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <Drawer open={mobileDayDrawerOpen} onOpenChange={setMobileDayDrawerOpen}>
        <DrawerContent className={MOBILE_DAY_EVENTS_DRAWER_CLASSNAME}>
          <DrawerTitle className="sr-only">
            {mobileSelectedDay
              ? format(mobileSelectedDay, "EEEE, dd MMMM yyyy", {
                  locale: id,
                })
              : "Events"}
          </DrawerTitle>
          <div className="border-neutral-primary flex items-center justify-between border-b px-4 py-4">
            <h3 className="text-heading-sm text-foreground-primary">
              {mobileSelectedDay
                ? format(mobileSelectedDay, "EEEE, dd MMMM yyyy", {
                    locale: id,
                  })
                : "Events"}
            </h3>
            <DrawerClose asChild>
              <button
                type="button"
                className="text-foreground-tertiary hover:text-foreground-primary inline-flex size-8 items-center justify-center rounded-full transition-colors"
                aria-label="Close event drawer"
              >
                <RiCloseLine className="size-6" />
              </button>
            </DrawerClose>
          </div>
          <DrawerBody className="overflow-y-auto px-4 py-4 pb-6">
            <div className="space-y-3">
              {mobileSelectedEvents.length === 0 ? (
                <p className="text-body-sm text-foreground-secondary">
                  Tidak ada event pada tanggal ini.
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
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
})
