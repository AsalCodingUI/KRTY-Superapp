"use client"

import { Skeleton } from "@/shared/ui"

export default function TeamsLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex flex-col rounded-xxl">
        {/* Stat counters */}
        <section className="grid grid-cols-1 gap-3 px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </section>

        {/* Search + add button bar */}
        <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-3 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:w-[260px]" />
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Table */}
        <div className="p-5">
          <div className="border-neutral-primary overflow-hidden rounded-lg border">
            <div className="border-neutral-primary flex gap-4 border-b px-4 py-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
            <div className="divide-border-neutral-primary divide-y">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex gap-4 px-4 py-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-4 w-24" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
