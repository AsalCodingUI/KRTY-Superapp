"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ProcessLoading() {
  return (
    <div className="flex flex-col">
      {/* Same rhythm as the page: title row, then phases + detail. */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="grid items-start gap-4 pb-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  )
}
