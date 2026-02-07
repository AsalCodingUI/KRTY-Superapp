"use client"

import { Skeleton } from "@/shared/ui"

export default function LeaveLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-neutral-primary bg-surface-neutral-primary space-y-3 rounded-lg border p-6"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="border-neutral-primary bg-surface-neutral-primary overflow-hidden rounded-lg border">
        {/* Table Header */}
        <div className="border-neutral-primary flex gap-4 border-b p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
        {/* Table Rows */}
        <div className="divide-border-neutral-primary divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 p-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <Skeleton key={j} className="h-4 w-20" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
