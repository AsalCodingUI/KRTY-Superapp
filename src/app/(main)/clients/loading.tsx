"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ClientsLoading() {
  return (
    <div className="flex flex-col">
      {/* Same rhythm as the page: title row, then content. */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Tabs and search */}
      <div className="mb-4 flex gap-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="mb-4 h-9 w-full rounded-md sm:max-w-sm" />

      <div className="grid gap-4 pb-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
