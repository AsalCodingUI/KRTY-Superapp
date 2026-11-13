"use client"

import { Skeleton } from "@/components/ui/skeleton"

/** Wiki Home's shape: the title row, the greeting, then cards and rows. */
export default function WikiLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between pt-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="rounded-control h-8 w-36" />
      </div>
      <Skeleton className="mx-auto h-8 w-72" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="rounded-card h-28 w-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="rounded-row h-14 w-full" />
        ))}
      </div>
    </div>
  )
}
