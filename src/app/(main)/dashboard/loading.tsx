"use client"

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="bg-border dark:bg-hover h-7 w-48 animate-pulse rounded"></div>
        <div className="bg-border dark:bg-hover h-9 w-32 animate-pulse rounded"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border-border space-y-3 rounded-lg border p-6"
          >
            <div className="bg-border dark:bg-hover h-4 w-24 animate-pulse rounded"></div>
            <div className="bg-border dark:bg-hover h-8 w-16 animate-pulse rounded"></div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="border-border rounded-lg border p-6">
        <div className="bg-border dark:bg-hover mb-4 h-5 w-32 animate-pulse rounded"></div>
        <div className="bg-border dark:bg-hover h-64 animate-pulse rounded"></div>
      </div>
    </div>
  )
}
