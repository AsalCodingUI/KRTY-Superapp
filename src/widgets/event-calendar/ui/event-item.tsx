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
    background: "bg-surface-brand-light",
    text: "text-foreground-brand-dark",
    accent: "bg-[var(--border-brand)]",
  },
  violet: {
    background: "bg-surface-brand-light",
    text: "text-foreground-brand-dark",
    accent: "bg-[var(--border-brand)]",
  },
  cyan: {
    background: "bg-surface-brand-light",
    text: "text-foreground-brand-dark",
    accent: "bg-[var(--border-brand)]",
  },
  emerald: {
    background: "bg-surface-success-light",
    text: "text-foreground-success-dark",
    accent: "bg-[var(--border-success)]",
  },
  rose: {
    background: "bg-surface-danger-light",
    text: "text-foreground-danger-dark",
    accent: "bg-[var(--border-danger)]",
  },
  orange: {
    background: "bg-surface-warning-light",
    text: "text-foreground-warning-on-color",
    accent: "bg-[var(--border-warning)]",
  },
  amber: {
    background: "bg-surface-warning-light",
    text: "text-foreground-warning-on-color",
    accent: "bg-[var(--border-warning)]",
  },
  neutral: {
    background: "bg-surface-neutral-secondary",
    text: "text-foreground-secondary",
    accent: "bg-[var(--border-neutral-primary)]",
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

  return (
    <button
      onClick={onClick}
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
          showMeta ? "gap-md" : "gap-0",
        )}
      >
        <div className="flex flex-col text-label-xs leading-4">
          <p className={cx("truncate", colors.text)}>{event.title}</p>
          {event.description && (
            <p className="text-body-xs text-foreground-secondary line-clamp-1">
              {event.description}
            </p>
          )}
        </div>

        {showMeta && (
          <div className="flex flex-wrap items-center gap-md">
            {showTime && !event.allDay && (
              <div className="flex items-center gap-sm">
                <RiTimeLine className="size-3.5 text-foreground-secondary" />
                <span className="text-body-xs text-foreground-secondary">
                  {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-sm">
                <RiMapPinLine className="size-3.5 text-foreground-secondary" />
                <span className="text-body-xs text-foreground-secondary truncate">
                  {event.location}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {timeLabel && (
        <div className="flex items-center justify-center rounded-sm bg-[rgba(255,255,255,0.6)] px-sm py-xs">
          <span className="text-label-xs text-foreground-secondary">
            {timeLabel}
          </span>
        </div>
      )}
    </button>
  )
})
