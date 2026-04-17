"use client"

import { Skeleton } from "@/shared/ui"

export default function NotificationsLoading() {
  return (
    <div className="flex flex-col">
      <div className="rounded-xxl flex items-center gap-2 px-4 pt-4 pb-3 xl:px-5">
        <Skeleton className="size-4 rounded-sm" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="bg-surface-neutral-primary rounded-xxl flex flex-col">
        <div className="border-neutral-primary border-b px-4 pt-3 xl:px-5">
          <div className="flex gap-4 pb-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-10" />
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3 rounded-md px-3 py-3">
              <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="mt-1 size-8 shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
