"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ContractsLoading() {
  return (
    <div className="flex flex-col">
      {/* Same rhythm as the page: title row, filters, then the list. */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="rounded-control h-8 w-36" />
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="rounded-control h-8 w-full sm:max-w-sm" />
        <Skeleton className="rounded-control h-8 w-44" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
