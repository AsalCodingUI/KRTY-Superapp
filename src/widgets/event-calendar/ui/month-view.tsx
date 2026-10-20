"use client"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
const MOBILE_DAY_EVENTS_DRAWER_CLASSNAME =
  "z-[82] h-[80vh] overflow-hidden rounded-t-[24px] border-t p-0"

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
      <div className="flex h-full w-full max-w-full min-w-[700px] flex-col overflow-hidden">
        {/* Weekday headers */}
        <div className="border-border flex border-b">
          {/* Week number header (removed) */}

          {/* Day headers */}
          <div className="grid flex-1 grid-cols-7">
            {WEEKDAY_LABELS.map((day, index) => (
              <div
                key={day}
                className={cx(
                  "border-border text-label-sm text-muted-foreground border-r py-2 text-center last:border-r-0",
                  index >= 5 && "bg-muted/50",
                )}
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
                selectedDate !== null ? isSameDay(day, selectedDate) : isToday
              const showTodayIndicator = isToday && !isSelected
              const isWeekend = day.getDay() === 0 || day.getDay() === 6
              const dayKey = day.toISOString()
              const hasMoreEvents = dayEvents.length > 3
              const displayEvents = dayEvents.slice(0, 3)

              return (
                <div
                  key={dayKey}
                  className={cx(
                    "border-border flex min-h-[96px] flex-col border-r border-b p-1 last:border-r-0 sm:min-h-[120px] sm:p-2",
                    isWeekend && "bg-muted/50",
                    "hover:bg-accent cursor-pointer transition-colors",
                  )}
                  onClick={() => handleDaySelect(day, dayEvents)}
                >
                  {/* Day number */}
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cx(
                        "text-label-sm flex h-6 w-6 items-center justify-center rounded-md",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : showTodayIndicator
                            ? "text-primary font-semibold"
                            : isCurrentMonth
                              ? "text-foreground"
                              : "text-muted-foreground/50",
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
                          <span className="text-muted-foreground/70 text-[9px] leading-none">
                            +{dayEvents.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Desktop: show event items */}
                    <div className="hidden space-y-1 sm:block">
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
                          <PopoverTrigger
                            render={
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenPopover(dayKey)
                                }}
                                className="text-label-xs text-muted-foreground/70 hover:text-foreground w-full px-2 py-1 text-left"
                              />
                            }
                          >
                            +{dayEvents.length - 3} lainnya
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[min(320px,calc(100vw-2rem))] p-3"
                            align="start"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              <h4 className="text-label-md text-foreground mb-3">
                                {format(day, "EEEE, dd MMMM yyyy", {
                                  locale: id,
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
                  locale: id,
                })
              : "Jadwal"}
          </SheetTitle>
          <div className="border-border flex items-center justify-between border-b px-4 py-4">
            <h3 className="text-heading-sm text-foreground">
              {mobileSelectedDay
                ? format(mobileSelectedDay, "EEEE, dd MMMM yyyy", {
                    locale: id,
                  })
                : "Jadwal"}
            </h3>
            <SheetClose
              render={
                <button
                  type="button"
                  className="text-muted-foreground/70 hover:text-foreground inline-flex size-8 items-center justify-center rounded-full transition-colors"
                  aria-label="Tutup panel jadwal"
                />
              }
            >
              <RiCloseLine className="size-6" />
            </SheetClose>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-6">
            <div className="space-y-3">
              {mobileSelectedEvents.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
})
