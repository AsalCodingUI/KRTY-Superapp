"use client"

import { Skeleton } from "@/shared/ui"

export default function TeamsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Team Cards Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="border-neutral-primary bg-surface-neutral-primary space-y-4 rounded-lg border p-6"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-8 w-8 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
