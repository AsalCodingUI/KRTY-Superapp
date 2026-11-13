"use client"

import { Skeleton } from "@/components/ui/skeleton"

/** A wiki page's shape: the crumbs, then the title and its lines. */
export default function WikiPageLoading() {
  return (
    <div className="flex flex-col">
      <Skeleton className="mt-3 h-5 w-48" />
      <div className="mx-auto mt-16 flex w-full max-w-3xl flex-col gap-3 px-6 sm:px-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mb-6 h-4 w-40" />
        {["w-full", "w-11/12", "w-4/5", "w-full", "w-3/5"].map((w, i) => (
          <Skeleton key={i} className={`h-4 ${w}`} />
        ))}
      </div>
    </div>
  )
}
