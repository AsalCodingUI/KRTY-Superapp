"use client"

import { Skeleton } from "@/shared/ui"

export default function CalculatorLoading() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
      {/* LEFT COLUMN */}
      <div className="space-y-10 lg:col-span-7">
        {/* Project Context Section */}
        <div>
          <Skeleton className="mb-6 h-5 w-32" />
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div>
          <Skeleton className="mb-6 h-5 w-32" />
          {[1, 2].map((i) => (
            <div key={i} className="mb-4 flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN - HUD */}
      <div className="lg:col-span-5">
        <div className="border-neutral-primary bg-surface-neutral-primary sticky top-6 space-y-6 rounded-lg border p-6">
          <Skeleton className="h-6 w-32" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
