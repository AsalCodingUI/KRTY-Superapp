"use client"

import { Skeleton } from "@/shared/ui"

export default function FinanceLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="bg-surface-neutral-primary flex flex-col rounded-xxl">
        <div className="px-5 py-2">
          <div className="grid gap-lg sm:grid-cols-2 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="border-neutral-primary bg-surface-neutral-primary space-y-3 rounded-lg border px-4 py-3"
              >
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-neutral-primary border-b px-5 pt-2">
          <Skeleton className="mb-2 h-10 w-48" />
        </div>

        <div className="space-y-5 p-5">
          <div className="border-neutral-primary rounded-lg border p-4">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
