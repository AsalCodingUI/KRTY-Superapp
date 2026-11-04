"use client"

import { useT } from "@/shared/i18n/client"
import { RiCalendar2Line } from "@/shared/ui/lucide-icons"
import { useMemo, useRef } from "react"
import { useCalendarContext } from "./calendar-context"
import { EventTarget, slotProps, useCalendarSurface } from "./calendar-menu"
import { EventItem } from "./event-item"
import type { CalendarEvent } from "./types"
import { getDayKey, groupEventsByDay } from "./utils"

interface AgendaViewProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
  const { currentDate } = useCalendarContext()
  const t = useT("calendar")
  // Right-click on the list: new event that day, today, go to a date.
  const rootRef = useRef<HTMLDivElement>(null)
  useCalendarSurface(rootRef)
  const dayEvents = useMemo(() => {
    const map = groupEventsByDay(events, currentDate, currentDate)
    const list = map.get(getDayKey(currentDate)) ?? []
    return [...list].sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, currentDate])

  return (
    <div
      ref={rootRef}
      {...slotProps(currentDate, "day")}
      className="flex h-full flex-col"
    >
      {/* Header */}

      {/* Event count */}
      <div className="text-tertiary-foreground px-6 py-3 text-xs">
        {t(dayEvents.length === 1 ? "agendaCountOne" : "agendaCountOther", {
          count: dayEvents.length,
        })}
      </div>

      {/* Events list */}
      <div className="scroll-pane pane-px-6 flex-1 pb-6">
        {dayEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
              <RiCalendar2Line className="size-5" />
            </div>
            <p className="text-muted-foreground text-sm">{t("agendaEmpty")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dayEvents.map((event) => (
              <EventTarget key={event.id} event={event}>
                <EventItem
                  event={event}
                  onClick={() => onEventClick?.(event)}
                  compact={false}
                  showTime
                />
              </EventTarget>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
