"use client"

import { cx } from "@/shared/lib/utils"
import { RiMapPinLine, RiTimeLine } from "@remixicon/react"
import { format } from "date-fns"
import { memo } from "react"
import { getEventColorClasses } from "./event-color-registry"
import type { CalendarEvent } from "./types"

interface EventItemProps {
  event: CalendarEvent
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  compact?: boolean
  showTime?: boolean
  className?: string
}

export const EventItem = memo(function EventItem({
  event,
  onClick,
  compact = false,
  showTime = true,
  className,
}: EventItemProps) {
  const colorClass = getEventColorClasses(event.color, "default")

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cx(
          "w-full rounded px-2 py-1 text-left text-xs",
          "hover:shadow-sm-border transition-all",
          "truncate",
          colorClass,
          className,
        )}
      >
        {showTime && !event.allDay && (
          <span className="mr-1 font-medium">
            {format(event.start, "HH:mm")}
          </span>
        )}
        <span className="truncate">{event.title}</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full rounded-lg p-3 text-left",
        "hover:shadow-md-border transition-all",
        "group",
        colorClass,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="mb-1 truncate text-sm font-medium">{event.title}</h4>
          {event.description && (
            <p className="mb-2 line-clamp-2 text-xs opacity-80">
              {event.description}
            </p>
          )}
        </div>
        {showTime && !event.allDay && (
          <div className="flex-shrink-0">
            <span className="bg-muted rounded-full px-2 py-1 text-xs font-medium">
              {format(event.start, "HH:mm")}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs opacity-70">
        {showTime && !event.allDay && (
          <div className="flex items-center gap-1">
            <RiTimeLine className="h-3.5 w-3.5" />
            <span>
              {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
            </span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center gap-1 truncate">
            <RiMapPinLine className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
      </div>
    </button>
  )
})
