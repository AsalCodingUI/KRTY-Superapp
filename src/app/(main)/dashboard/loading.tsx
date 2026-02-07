"use client"

import { Skeleton } from "@/shared/ui"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border-neutral-primary bg-surface-neutral-primary space-y-3 rounded-lg border p-6"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="border-neutral-primary bg-surface-neutral-primary rounded-lg border p-6">
        <Skeleton className="mb-4 h-5 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}
