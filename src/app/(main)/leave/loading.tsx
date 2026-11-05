"use client"

import {
  listHeaderClassName,
  listRowClassName,
} from "@/components/grouped-list"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function LeaveLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="rounded-control h-8 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* The list look: column labels on the pill, rows without lines. */}
      <div className="list-bleed flex flex-col">
        <div className={cn(listHeaderClassName, "flex items-center gap-x-4")}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-3.5 w-20" />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={cn(listRowClassName, "gap-x-4")}>
            {[1, 2, 3, 4, 5].map((j) => (
              <Skeleton key={j} className="h-4 w-20" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
