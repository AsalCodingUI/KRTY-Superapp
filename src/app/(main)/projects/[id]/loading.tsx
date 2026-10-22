"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function ProjectDetailLoading() {
  return (
    <div className="flex flex-col">
      {/* Same rhythm as the page: title row, then content. */}
      <div className="flex items-center justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Content Skeleton */}
      <div className="space-y-4 pb-4">
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
