"use client"

import { cx } from "@/shared/lib/utils"
import { Skeleton } from "@/shared/ui"

export function CalendarSkeleton() {
  const daysInWeek = 7
  const weeksToShow = 5

  return (
    <div className="flex h-full flex-col">
      {/* Header row */}
      <div className="border-neutral-primary grid grid-cols-7 border-b">
        {Array.from({ length: daysInWeek }).map((_, i) => (
          <div
            key={i}
            className="border-neutral-primary border-r p-2 text-center last:border-r-0"
          >
            <Skeleton className="mx-auto h-4 w-12" />
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-rows-5">
        {Array.from({ length: weeksToShow }).map((_, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {Array.from({ length: daysInWeek }).map((_, dayIndex) => (
              <div
                key={dayIndex}
                className={cx(
                  "border-neutral-primary border-r border-b last:border-r-0",
                  "flex flex-col gap-2 p-2",
                )}
              >
                {/* Date number skeleton */}
                <Skeleton className="h-6 w-6 rounded-full" />

                {/* Event skeletons */}
                {dayIndex % 3 === 0 && (
                  <>
                    <Skeleton className="h-6 w-full rounded" />
                    {dayIndex % 2 === 0 && (
                      <Skeleton className="h-6 w-full rounded" />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
