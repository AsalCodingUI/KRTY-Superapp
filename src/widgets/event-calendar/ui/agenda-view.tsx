"use client";

import { cx } from '@/shared/lib/utils';
import { isSameDay } from 'date-fns';
import { useCalendarContext } from './calendar-context';
import { getEventColorClasses } from './event-color-registry';
import type { CalendarEvent } from './types';

interface AgendaViewProps {
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
}

// Format time to 12-hour format
const formatTime12Hour = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

export function AgendaView({ events, onEventClick }: AgendaViewProps) {
    const { currentDate } = useCalendarContext();

    // Filter events for current date
    const dayEvents = events
        .filter((event) => isSameDay(event.start, currentDate))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    return (
        <div className="h-full flex flex-col bg-surface">
            {/* Header */}


            {/* Event count */}
            <div className="px-6 py-3 text-xs text-content-muted">
                {dayEvents.length} jadwal hari ini
            </div>

            {/* Events list */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {dayEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <span className="text-6xl mb-4">📅</span>
                        <p className="text-sm text-content-muted">
                            Tidak ada jadwal hari ini
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {dayEvents.map((event) => {
                            const colorClasses = getEventColorClasses(event.color, 'default');

                            return (
                                <button
                                    key={event.id}
                                    onClick={() => onEventClick?.(event)}
                                    className={cx(
                                        'w-full text-left py-2 px-3 transition-colors rounded',
                                        colorClasses,
                                        'hover:shadow-sm'
                                    )}
                                >
                                    <div className="text-sm font-medium">
                                        {event.title || <span className="italic text-content-muted">(No title)</span>}
                                    </div>
                                    <div className="text-xs mt-0.5 opacity-70">
                                        {event.allDay
                                            ? 'Sepanjang hari'
                                            : `${formatTime12Hour(event.start)} - ${formatTime12Hour(event.end)}`
                                        }
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
