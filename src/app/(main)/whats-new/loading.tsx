"use client"

import { Skeleton } from "@/components/ui/skeleton"

/** Yang baru's shape: the title row with search, then the entries. */
export default function WhatsNewLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="rounded-control h-8 w-32 sm:w-64" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="rounded-row h-16 w-full" />
        ))}
      </div>
    </div>
  )
}
