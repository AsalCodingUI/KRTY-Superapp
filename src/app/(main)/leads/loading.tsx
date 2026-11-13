"use client"

import { Skeleton } from "@/components/ui/skeleton"

/** Kelola situs' shape: the title row, then the sites. */
export default function LeadsLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="rounded-control h-8 w-32" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="rounded-row h-14 w-full" />
        ))}
      </div>
    </div>
  )
}
