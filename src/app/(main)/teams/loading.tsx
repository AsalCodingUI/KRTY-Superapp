"use client"

export default function TeamsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="bg-border dark:bg-hover h-7 w-32 animate-pulse rounded"></div>
        <div className="bg-border dark:bg-hover h-9 w-28 animate-pulse rounded"></div>
      </div>

      {/* Team Cards Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="border-border space-y-4 rounded-lg border p-6"
          >
            <div className="flex items-center justify-between">
              <div className="bg-border dark:bg-hover h-5 w-32 animate-pulse rounded"></div>
              <div className="bg-border dark:bg-hover h-6 w-16 animate-pulse rounded-full"></div>
            </div>
            <div className="bg-border dark:bg-hover h-4 w-full animate-pulse rounded"></div>
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="bg-border dark:bg-hover h-8 w-8 animate-pulse rounded-full"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
