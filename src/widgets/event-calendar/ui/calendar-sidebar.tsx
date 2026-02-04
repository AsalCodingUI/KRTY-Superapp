"use client";

import { cx } from '@/shared/lib/utils';
import { RiCheckboxCircleLine, RiCloseCircleLine, RiEyeLine, RiEyeOffLine, RiGoogleFill, RiLoader4Line } from '@remixicon/react';
import { useEventVisibility } from './hooks/use-event-visibility';
import { useGoogleCalendar } from './hooks/use-google-calendar';
import { MiniCalendar } from './mini-calendar';

export function CalendarSidebar() {
    const { categories, toggleColor } = useEventVisibility();
    const { isConnected, isLoading } = useGoogleCalendar();

    return (
        <div className="hidden lg:block w-64 bg-surface h-full overflow-y-auto flex-shrink-0">
            <div className="space-y-6">
                {/* Mini Calendar */}
                <MiniCalendar />

                {/* Event Categories */}
                <div className="">
                    <h4 className="text-sm font-semibold text-content mb-3">
                        Kretya Calendar
                    </h4>
                    <div className="space-y-1">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => toggleColor(category.color)}
                                className="flex items-center gap-2.5 w-full text-left text-sm px-2.5 py-2 rounded-md transition-colors hover:bg-muted"
                            >
                                {/* Color indicator - solid circle */}
                                <span
                                    className={cx(
                                        'w-2.5 h-2.5 rounded-full flex-shrink-0',
                                        `bg-${category.color}-500`
                                    )}
                                />

                                {/* Label */}
                                <span className="flex-1 text-content text-sm break-words">{category.name}</span>

                                {/* Eye icon - show/hide */}
                                {category.isActive ? (
                                    <RiEyeLine className="w-4 h-4 text-content-muted flex-shrink-0" />
                                ) : (
                                    <RiEyeOffLine className="w-4 h-4 text-content-muted flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Connect Calendar */}
                <div className="">
                    <h4 className="text-sm font-semibold text-content mb-3">
                        Connect Calendar
                    </h4>
                    <div className="space-y-2">
                        <div
                            className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md cursor-default"
                        >
                            {/* Google Calendar Icon */}
                            <RiGoogleFill className="w-4 h-4 text-content-muted flex-shrink-0" />

                            {/* Label */}
                            <span className="flex-1 text-left text-sm text-content">Google Calendar</span>

                            {/* Status Icon */}
                            {isLoading ? (
                                <RiLoader4Line className="w-4 h-4 text-content-muted flex-shrink-0 animate-spin" />
                            ) : isConnected ? (
                                <RiCheckboxCircleLine className="w-4 h-4 text-success flex-shrink-0" />
                            ) : (
                                <RiCloseCircleLine className="w-4 h-4 text-content-muted flex-shrink-0" />
                            )}
                        </div>

                        {/* Status Text */}
                        <div className="px-2.5">
                            <span className={cx(
                                "text-xs",
                                isConnected ? "text-success" : "text-content-muted"
                            )}>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
