"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Settings Form Skeleton */}
      <div className="space-y-4 rounded-lg">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}
