"use client"

import { cx } from "@/shared/lib/utils"
import { RiMapPinLine, RiTimeLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { memo } from "react"
import type { CalendarEvent, EventColor } from "./types"

const EVENT_ITEM_COLORS: Record<
  EventColor,
  { background: string; text: string; accent: string }
> = {
  blue: {
    background: "bg-primary/10",
    text: "text-primary",
    accent: "bg-[var(--primary)]",
  },
  violet: {
    background: "bg-primary/10",
    text: "text-primary",
    accent: "bg-[var(--primary)]",
  },
  cyan: {
    background: "bg-primary/10",
    text: "text-primary",
    accent: "bg-[var(--primary)]",
  },
  emerald: {
    background: "bg-success/10",
    text: "text-success",
    accent: "bg-[var(--border-success)]",
  },
  rose: {
    background: "bg-destructive/10",
    text: "text-destructive",
    accent: "bg-[var(--destructive)]",
  },
  orange: {
    background: "bg-warning/10",
    text: "text-warning",
    accent: "bg-[var(--warning)]",
  },
  amber: {
    background: "bg-warning/10",
    text: "text-warning",
    accent: "bg-[var(--warning)]",
  },
  neutral: {
    background: "bg-muted",
    text: "text-muted-foreground",
    accent: "bg-[var(--border)]",
  },
}

const getEventItemColors = (color: EventColor) =>
  EVENT_ITEM_COLORS[color] || EVENT_ITEM_COLORS.blue

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
  const colors = getEventItemColors(event.color)
  const timeLabel =
    showTime && !event.allDay ? format(event.start, "HH:mm") : null

  if (compact) {
    const compactLabel = showTime && !event.allDay
      ? `${format(event.start, "HH:mm")} ${event.title}`
      : event.title

    return (
      <button
        onClick={onClick}
        className={cx(
          "flex w-full items-center gap-xs rounded-sm px-sm py-xs text-left text-label-xs",
          colors.background,
          colors.text,
          className,
        )}
      >
        <div className="flex self-stretch items-center px-xs py-[4px]">
          <span className={cx("h-full w-px rounded-full", colors.accent)} />
        </div>
        <span className="min-w-0 flex-1 truncate">{compactLabel}</span>
      </button>
    )
  }

  const showMeta = (showTime && !event.allDay) || Boolean(event.location)
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent parent day-cell click from opening "new event" dialog.
    e.stopPropagation()
    onClick?.(e)
  }

  return (
    <button
      onClick={handleClick}
      className={cx(
        "flex w-full items-start gap-sm rounded-md p-sm text-left",
        colors.background,
        className,
      )}
    >
      <div className="flex self-stretch items-center px-xs py-[4px]">
        <span className={cx("h-full w-px rounded-full", colors.accent)} />
      </div>

      <div
        className={cx(
          "flex min-w-0 flex-1 flex-col p-xs",
          showMeta ? "gap-lg" : "gap-0",
        )}
      >
        <div className="flex flex-col text-label-xs leading-4">
          <p className={cx("truncate", colors.text)}>{event.title}</p>
          {event.description && (
            <p className="text-body-xs text-muted-foreground line-clamp-1">
              {event.description}
            </p>
          )}
        </div>

        {showMeta && (
          <div className="flex flex-wrap items-center gap-lg">
            {showTime && !event.allDay && (
              <div className="flex items-center gap-sm">
                <RiTimeLine className="size-3.5 text-muted-foreground" />
                <span className="text-body-xs text-muted-foreground">
                  {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-sm">
                <RiMapPinLine className="size-3.5 text-muted-foreground" />
                <span className="text-body-xs text-muted-foreground truncate">
                  {event.location}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {timeLabel && (
        <div className="flex items-center justify-center rounded-sm bg-[rgba(255,255,255,0.6)] px-sm py-xs">
          <span className="text-label-xs text-muted-foreground">
            {timeLabel}
          </span>
        </div>
      )}
    </button>
  )
})
