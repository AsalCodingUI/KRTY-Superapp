"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ContractsLoading() {
  return (
    <div className="flex flex-col">
      {/* Same rhythm as the page: title row, filters, then the list. */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-36 rounded-full" />
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 w-full rounded-full sm:max-w-sm" />
        <Skeleton className="h-8 w-44 rounded-full" />
      </div>
      <div className="flex flex-col gap-2 pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
