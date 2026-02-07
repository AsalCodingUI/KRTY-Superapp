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
      emerald:
        "bg-surface-success-light text-foreground-success-dark border-success-subtle",
      orange:
        "bg-surface-warning-light text-foreground-warning-dark border-warning-subtle",
      violet:
        "bg-surface-chart-4 text-foreground-chart-4 border-border-neutral-secondary",
      blue: "bg-surface-brand-light text-foreground-brand-dark border-brand-light",
      rose: "bg-surface-chart-5 text-foreground-chart-5 border-border-neutral-secondary",
      amber:
        "bg-surface-warning-light text-foreground-warning-dark border-warning-subtle",
      cyan: "bg-surface-chart-6 text-foreground-chart-6 border-border-neutral-secondary",
      neutral:
        "bg-surface-neutral-secondary text-foreground-secondary border-neutral-secondary",
    }
    return colorMap[color] || colorMap.neutral
  }

  const colorClass = getColorClasses(color)

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cx(
          "text-body-xs w-full rounded border px-2 py-1 text-left",
          "transition-all hover:shadow-sm",
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
        "transition-all hover:shadow-md",
        "group",
        colorClass,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-label-md mb-1 truncate">{title}</h4>
          {description && (
            <p className="text-body-xs mb-2 line-clamp-2 opacity-80">
              {description}
            </p>
          )}
        </div>
        {showTime && !allDay && (
          <div className="flex-shrink-0">
            <span className="text-label-xs bg-muted rounded-full px-2 py-1">
              {format(start, "HH:mm")}
            </span>
          </div>
        )}
      </div>

      <div className="text-body-xs mt-2 flex items-center gap-3 opacity-70">
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
