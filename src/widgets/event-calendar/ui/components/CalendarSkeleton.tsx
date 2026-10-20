"use client"

import { Skeleton } from "@/components/ui/skeleton"

const DAYS = 7
const HOURS = 9
/** A few placeholder blocks so the loading grid reads as a calendar. */
const BLOCKS: Record<number, { top: number; height: number }[]> = {
  0: [{ top: 1, height: 1 }],
  2: [{ top: 3, height: 2 }],
  3: [{ top: 0, height: 1 }],
  4: [{ top: 5, height: 1 }],
}

/** Loading state shaped like the week view (header, all-day strip, hours). */
export function CalendarSkeleton() {
  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden">
      <div className="flex border-b">
        <div className="w-14 shrink-0 border-r" />
        {Array.from({ length: DAYS }).map((_, i) => (
          <div
            key={i}
            className="flex flex-1 items-center gap-1.5 border-r border-dashed px-2.5 py-2 last:border-r-0"
          >
            <Skeleton className="h-3.5 w-7" />
            <Skeleton className="size-6 rounded-[5px]" />
          </div>
        ))}
      </div>
      <div className="flex border-b">
        <div className="w-14 shrink-0 border-r" />
        {Array.from({ length: DAYS }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-14 flex-1 flex-col gap-1.5 border-r border-dashed px-2.5 py-2 last:border-r-0"
          >
            {i % 3 === 1 && <Skeleton className="h-3 w-3/4" />}
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-14 shrink-0 border-r">
          {Array.from({ length: HOURS }).map((_, h) => (
            <div key={h} className="flex h-16 justify-end px-2 pt-1.5">
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
        {Array.from({ length: DAYS }).map((_, d) => (
          <div
            key={d}
            className="relative flex-1 border-r border-dashed last:border-r-0"
          >
            {Array.from({ length: HOURS }).map((_, h) => (
              <div key={h} className="h-16 border-b" />
            ))}
            {(BLOCKS[d] ?? []).map((b, i) => (
              <Skeleton
                key={i}
                className="absolute inset-x-1 rounded-md"
                style={{ top: b.top * 64 + 2, height: b.height * 64 - 4 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
