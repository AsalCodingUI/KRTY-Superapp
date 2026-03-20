"use client"

import { Skeleton } from "@/shared/ui"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <Skeleton className="mb-2 h-5 w-44" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border-neutral-primary bg-surface space-y-3 rounded-lg border p-4"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="border-neutral-primary bg-surface rounded-lg border p-4">
              <Skeleton className="mb-4 h-4 w-40" />
              <Skeleton className="h-44 w-full" />
            </div>
            <div className="border-neutral-primary bg-surface rounded-lg border p-4">
              <Skeleton className="mb-4 h-4 w-40" />
              <Skeleton className="h-44 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
