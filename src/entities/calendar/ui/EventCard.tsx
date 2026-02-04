"use client"

import { cx } from '@/shared/lib/utils'
import { RiMapPinLine, RiTimeLine, RiUserLine } from '@remixicon/react'
import { format } from 'date-fns'

export type EventColor = 'emerald' | 'orange' | 'violet' | 'blue' | 'rose' | 'amber' | 'cyan' | 'neutral'

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
            emerald: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800',
            orange: 'bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100 border-orange-200 dark:border-orange-800',
            violet: 'bg-violet-100 dark:bg-violet-950 text-violet-900 dark:text-violet-100 border-violet-200 dark:border-violet-800',
            blue: 'bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800',
            rose: 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-100 border-rose-200 dark:border-rose-800',
            amber: 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800',
            cyan: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-100 border-cyan-200 dark:border-cyan-800',
            neutral: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-700',
        }
        return colorMap[color] || colorMap.neutral
    }

    const colorClass = getColorClasses(color)

    if (compact) {
        return (
            <button
                onClick={onClick}
                className={cx(
                    'w-full text-left px-2 py-1 rounded text-xs border',
                    'hover:shadow-sm transition-all',
                    'truncate',
                    colorClass,
                    className
                )}
            >
                {showTime && !allDay && (
                    <span className="font-medium mr-1">
                        {format(start, 'HH:mm')}
                    </span>
                )}
                <span className="truncate">{title}</span>
            </button>
        )
    }

    return (
        <button
            onClick={onClick}
            className={cx(
                'w-full text-left p-3 rounded-lg border',
                'hover:shadow-md transition-all',
                'group',
                colorClass,
                className
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate mb-1">
                        {title}
                    </h4>
                    {description && (
                        <p className="text-xs opacity-80 line-clamp-2 mb-2">
                            {description}
                        </p>
                    )}
                </div>
                {showTime && !allDay && (
                    <div className="flex-shrink-0">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted">
                            {format(start, 'HH:mm')}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs opacity-70">
                {showTime && !allDay && (
                    <div className="flex items-center gap-1">
                        <RiTimeLine className="w-3.5 h-3.5" />
                        <span>
                            {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                        </span>
                    </div>
                )}
                {location && (
                    <div className="flex items-center gap-1 truncate">
                        <RiMapPinLine className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{location}</span>
                    </div>
                )}
                {(organizer || guestCount) && (
                    <div className="flex items-center gap-1">
                        <RiUserLine className="w-3.5 h-3.5" />
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
