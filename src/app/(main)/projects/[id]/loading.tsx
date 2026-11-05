"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectDetailLoading() {
  return (
    <div className="flex flex-col">
      {/* Same rhythm as the page: title row, then content. */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="rounded-control h-8 w-32" />
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="rounded-lg">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
        <div className="rounded-lg">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-4 h-32 w-full" />
        </div>
        <div className="rounded-lg">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-4 h-40 w-full" />
        </div>
      </div>
    </div>
  )
}
