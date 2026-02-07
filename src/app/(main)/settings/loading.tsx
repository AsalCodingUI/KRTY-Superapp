"use client"

import { Skeleton } from "@/shared/ui"

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Settings Form Skeleton */}
      <div className="border-neutral-primary bg-surface-neutral-primary space-y-6 rounded-lg border p-6">
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
