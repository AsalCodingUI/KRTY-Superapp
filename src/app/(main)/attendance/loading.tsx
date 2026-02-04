"use client"

export default function AttendanceLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="bg-border dark:bg-hover h-7 w-48 animate-pulse rounded"></div>
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

      {/* Clock Action Skeleton */}
      <div className="border-border rounded-lg border p-6">
        <div className="bg-border dark:bg-hover mx-auto h-12 w-32 animate-pulse rounded"></div>
      </div>

      {/* History List Skeleton */}
      <div className="space-y-3">
        <div className="bg-border dark:bg-hover h-5 w-24 animate-pulse rounded"></div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-border dark:bg-hover h-16 animate-pulse rounded"
          ></div>
        ))}
      </div>
    </div>
  )
}
