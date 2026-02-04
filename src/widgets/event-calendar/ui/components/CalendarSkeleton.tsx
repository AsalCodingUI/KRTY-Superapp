"use client";

import { cx } from '@/shared/lib/utils';

export function CalendarSkeleton() {
    const daysInWeek = 7;
    const weeksToShow = 5;

    return (
        <div className="flex flex-col h-full">
            {/* Header row */}
            <div className="grid grid-cols-7 border-b border-border-border">
                {Array.from({ length: daysInWeek }).map((_, i) => (
                    <div
                        key={i}
                        className="p-2 text-center border-r border-border-border last:border-r-0"
                    >
                        <div className="h-4 w-12 bg-muted animate-pulse rounded mx-auto" />
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 grid grid-rows-5">
                {Array.from({ length: weeksToShow }).map((_, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7">
                        {Array.from({ length: daysInWeek }).map((_, dayIndex) => (
                            <div
                                key={dayIndex}
                                className={cx(
                                    'border-r border-b border-border-border last:border-r-0',
                                    'p-2 flex flex-col gap-2'
                                )}
                            >
                                {/* Date number skeleton */}
                                <div className="h-6 w-6 bg-muted animate-pulse rounded-full" />

                                {/* Event skeletons */}
                                {dayIndex % 3 === 0 && (
                                    <>
                                        <div className="h-6 bg-muted animate-pulse rounded" />
                                        {dayIndex % 2 === 0 && (
                                            <div className="h-6 bg-muted animate-pulse rounded" />
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
