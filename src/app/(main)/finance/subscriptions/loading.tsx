"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function FinanceSubscriptionsLoading() {
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

      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
