"use client"

import { useT } from "@/shared/i18n/client"
import { RiCalendar2Line } from "@/shared/ui/lucide-icons"
import { useMemo } from "react"
import { useCalendarContext } from "./calendar-context"
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
  const dayEvents = useMemo(() => {
    const map = groupEventsByDay(events, currentDate, currentDate)
    const list = map.get(getDayKey(currentDate)) ?? []
    return [...list].sort((a, b) => a.start.getTime() - b.start.getTime())
  }, [events, currentDate])

  return (
    <div className="flex h-full flex-col">
      {/* Header */}

      {/* Event count */}
      <div className="text-tertiary-foreground px-6 py-3 text-xs">
        {t(dayEvents.length === 1 ? "agendaCountOne" : "agendaCountOther", {
          count: dayEvents.length,
        })}
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {dayEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="bg-muted text-muted-foreground mb-4 flex size-12 items-center justify-center rounded-full">
              <RiCalendar2Line className="size-5" />
            </div>
            <p className="text-muted-foreground text-sm">{t("agendaEmpty")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onClick={() => onEventClick?.(event)}
                compact={false}
                showTime
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
