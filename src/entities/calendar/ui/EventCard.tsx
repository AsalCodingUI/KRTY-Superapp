"use client"

import { cx } from "@/shared/lib/utils"
import { RiMapPinLine, RiTimeLine, RiUserLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"

export type EventColor =
  | "emerald"
  | "orange"
  | "violet"
  | "blue"
  | "rose"
  | "amber"
  | "cyan"
  | "neutral"

interface EventCardProps {
  title: string
  description?: string
  start: Date
  end: Date
  color: EventColor
  location?: string
  allDay?: boolean
  organizer?: string
  guestCount?: number
  onClick?: () => void
  compact?: boolean
  showTime?: boolean
  className?: string
}

/**
 * EventCard - Displays calendar event information
 *
 * Shows event title, time, location, and organizer with color-coded styling.
 * Supports both compact and full display modes.
 */
export function EventCard({
  title,
  description,
  start,
  end,
  color,
  location,
  allDay = false,
  organizer,
  guestCount,
  onClick,
  compact = false,
  showTime = true,
  className,
}: EventCardProps) {
  const getColorClasses = (color: EventColor): string => {
    const colorMap: Record<EventColor, string> = {
      emerald: "bg-success/10 text-success border-success/30",
      orange: "bg-warning/10 text-warning border-warning/30",
      violet: "bg-purple-3 text-purple-11 border-border",
      blue: "bg-primary/10 text-primary border-primary/30",
      rose: "bg-pink-3 text-pink-11 border-border",
      amber: "bg-warning/10 text-warning border-warning/30",
      cyan: "bg-cyan-3 text-cyan-11 border-border",
      neutral: "bg-muted text-muted-foreground border-border",
    }
    return colorMap[color] || colorMap.neutral
  }

  const colorClass = getColorClasses(color)

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cx(
          "w-full rounded border px-2 py-1 text-left text-xs",
          "transition-shadow hover:shadow-(--elev-2)",
          "truncate",
          colorClass,
          className,
        )}
      >
        {showTime && !allDay && (
          <span className="mr-1 font-medium">{format(start, "HH:mm")}</span>
        )}
        <span className="truncate">{title}</span>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full rounded-lg border p-3 text-left",
        "transition-shadow hover:shadow-(--elev-2)",
        "group",
        colorClass,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="mb-1 truncate text-sm font-medium">{title}</h4>
          {description && (
            <p className="mb-2 line-clamp-2 text-xs opacity-80">
              {description}
            </p>
          )}
        </div>
        {showTime && !allDay && (
          <div className="flex-shrink-0">
            <span className="bg-muted rounded-sm px-1.5 py-0.5 text-xs font-medium">
              {format(start, "HH:mm")}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs opacity-70">
        {showTime && !allDay && (
          <div className="flex items-center gap-1">
            <RiTimeLine className="h-3.5 w-3.5" />
            <span>
              {format(start, "HH:mm")} - {format(end, "HH:mm")}
            </span>
          </div>
        )}
        {location && (
          <div className="flex items-center gap-1 truncate">
            <RiMapPinLine className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        )}
        {(organizer || guestCount) && (
          <div className="flex items-center gap-1">
            <RiUserLine className="h-3.5 w-3.5" />
            <span>
              {organizer && <span className="truncate">{organizer}</span>}
              {guestCount && <span>+{guestCount}</span>}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
