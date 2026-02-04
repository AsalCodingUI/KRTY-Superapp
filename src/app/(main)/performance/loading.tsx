"use client"

export default function PerformanceLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="bg-border dark:bg-hover h-7 w-64 animate-pulse rounded"></div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="border-border flex gap-2 border-b">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-border dark:bg-hover h-10 w-24 animate-pulse rounded-t"
          ></div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <div className="bg-border dark:bg-hover h-32 animate-pulse rounded"></div>
        <div className="bg-border dark:bg-hover h-48 animate-pulse rounded"></div>
        <div className="bg-border dark:bg-hover h-64 animate-pulse rounded"></div>
      </div>
    </div>
  )
}
