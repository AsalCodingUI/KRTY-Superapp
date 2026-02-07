"use client"

import { Skeleton } from "@/shared/ui"

export function AgendaSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="border-neutral-primary flex gap-4 rounded-lg border p-4"
        >
          {/* Date column */}
          <div className="flex w-16 flex-col items-center gap-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          {/* Event details */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
