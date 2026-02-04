"use client"

export default function LeaveLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="bg-border dark:bg-hover h-7 w-40 animate-pulse rounded"></div>
        <div className="bg-border dark:bg-hover h-9 w-32 animate-pulse rounded"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-border space-y-3 rounded-lg border p-6"
          >
            <div className="bg-border dark:bg-hover h-4 w-24 animate-pulse rounded"></div>
            <div className="bg-border dark:bg-hover h-8 w-16 animate-pulse rounded"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="border-border overflow-hidden rounded-lg border">
        {/* Table Header */}
        <div className="border-border bg-muted dark:bg-surface/50 flex gap-4 border-b p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-border dark:bg-hover h-4 w-20 animate-pulse rounded"
            ></div>
          ))}
        </div>
        {/* Table Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="border-border flex gap-4 border-b p-4 last:border-0"
          >
            {[1, 2, 3, 4, 5].map((j) => (
              <div
                key={j}
                className="bg-border dark:bg-hover h-4 w-20 animate-pulse rounded"
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
