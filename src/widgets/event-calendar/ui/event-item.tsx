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
  pink: {
    background: "bg-pink-9/10",
    text: "text-pink-11",
    accent: "bg-pink-9",
  },
  teal: {
    background: "bg-teal-9/10",
    text: "text-teal-11",
    accent: "bg-teal-9",
  },
  emerald: {
    background: "bg-success/10",
    text: "text-success-ink",
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
    const compactLabel =
      showTime && !event.allDay
        ? `${format(event.start, "HH:mm")} ${event.title}`
        : event.title

    return (
      <button
        onClick={onClick}
        className={cx(
          "flex w-full items-center gap-0.5 rounded-sm px-1 py-0.5 text-left text-xs font-medium",
          colors.background,
          colors.text,
          className,
        )}
      >
        <div className="flex items-center self-stretch px-0.5 py-[4px]">
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
        "flex w-full items-start gap-1 rounded-md p-1 text-left",
        colors.background,
        className,
      )}
    >
      <div className="flex items-center self-stretch px-0.5 py-[4px]">
        <span className={cx("h-full w-px rounded-full", colors.accent)} />
      </div>

      <div
        className={cx(
          "flex min-w-0 flex-1 flex-col p-0.5",
          showMeta ? "gap-3" : "gap-0",
        )}
      >
        <div className="flex flex-col text-xs leading-4 font-medium">
          <p className={cx("truncate", colors.text)}>{event.title}</p>
          {event.description && (
            <p className="text-muted-foreground line-clamp-1 text-xs">
              {event.description}
            </p>
          )}
        </div>

        {showMeta && (
          <div className="flex flex-wrap items-center gap-3">
            {showTime && !event.allDay && (
              <div className="flex items-center gap-1">
                <RiTimeLine className="text-muted-foreground size-3.5" />
                <span className="text-muted-foreground text-xs">
                  {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1">
                <RiMapPinLine className="text-muted-foreground size-3.5" />
                <span className="text-muted-foreground truncate text-xs">
                  {event.location}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {timeLabel && (
        <div className="bg-background/60 flex items-center justify-center rounded-sm px-1 py-0.5">
          <span className="text-muted-foreground text-xs font-medium">
            {timeLabel}
          </span>
        </div>
      )}
    </button>
  )
})
