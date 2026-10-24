"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function FinanceLoading() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Same rhythm as the page: title, quick actions, then content. */}
      <Skeleton className="mt-6 h-8 w-48" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-36 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-9 w-64 rounded-md" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}
