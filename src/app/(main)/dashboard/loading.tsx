"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 pb-4">
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="flex flex-col">
        <div className="space-y-5 p-4 sm:p-5">
          <div>
            <Skeleton className="mb-2 h-5 w-44" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="border-border bg-card space-y-3 rounded-lg border p-4"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="border-border bg-card rounded-lg border p-4">
              <Skeleton className="mb-4 h-4 w-40" />
              <Skeleton className="h-44 w-full" />
            </div>
            <div className="border-border bg-card rounded-lg border p-4">
              <Skeleton className="mb-4 h-4 w-40" />
              <Skeleton className="h-44 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
