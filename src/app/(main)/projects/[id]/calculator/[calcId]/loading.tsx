"use client"

import { Skeleton } from "@/shared/ui"

export default function ProjectCalculatorEditLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:gap-8">
        <div className="space-y-6 md:col-span-7">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="md:col-span-5">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  )
}
