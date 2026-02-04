"use client"

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <div className="bg-border dark:bg-hover h-7 w-32 animate-pulse rounded"></div>
        <div className="bg-border dark:bg-hover mt-2 h-4 w-64 animate-pulse rounded"></div>
      </div>

      {/* Settings Form Skeleton */}
      <div className="border-border space-y-6 rounded-lg border p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="bg-border dark:bg-hover h-4 w-24 animate-pulse rounded"></div>
            <div className="bg-border dark:bg-hover h-10 animate-pulse rounded"></div>
          </div>
        ))}
        <div className="bg-border dark:bg-hover h-10 w-24 animate-pulse rounded"></div>
      </div>
    </div>
  )
}
