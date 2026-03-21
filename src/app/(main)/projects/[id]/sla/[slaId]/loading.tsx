"use client"

import { Skeleton } from "@/shared/ui"

export default function ProjectSLAEditLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-[520px] w-full" />
    </div>
  )
}
