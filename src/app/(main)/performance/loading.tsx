"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function PerformanceLoading() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-7 w-64" />
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="border-border flex gap-2 border-b">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-t" />
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <div className="rounded-lg">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
        <div className="rounded-lg">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-4 h-32 w-full" />
        </div>
        <div className="rounded-lg">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
      </div>
    </div>
  )
}
