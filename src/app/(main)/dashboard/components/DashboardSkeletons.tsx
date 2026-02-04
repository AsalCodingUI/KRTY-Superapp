import { Skeleton } from "@/components/ui"
import React from "react"

export function AdminMetricsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="border-border-border bg-surface rounded-lg border p-4"
        >
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

export function AdminChartSkeleton() {
  // Use deterministic heights instead of Math.random() to avoid hydration mismatch
  const barHeights = [45, 70, 55, 80, 60, 75]

  return (
    <div className="border-border-border bg-surface h-[400px] rounded-lg border p-6">
      <Skeleton className="mb-6 h-6 w-48" />
      <div className="flex h-[300px] items-end gap-4">
        {barHeights.map((height, i) => (
          <div
            key={i}
            className="bg-muted/20 h-[var(--height)] flex-1 rounded-t-lg"
            style={{ "--height": `${height}%` } as React.CSSProperties}
          >
            <Skeleton className="size-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminListSkeleton() {
  return (
    <div className="border-border-border bg-surface rounded-lg border p-6">
      <Skeleton className="mb-4 h-6 w-40" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
