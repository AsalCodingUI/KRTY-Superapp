"use client"

export function AgendaSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="border-border-border flex gap-4 rounded-lg border p-4"
        >
          {/* Date column */}
          <div className="flex w-16 flex-col items-center gap-1">
            <div className="bg-muted h-4 w-12 animate-pulse rounded" />
            <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
          </div>

          {/* Event details */}
          <div className="flex-1 space-y-2">
            <div className="bg-muted h-5 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
            <div className="flex gap-2">
              <div className="bg-muted h-6 w-20 animate-pulse rounded-full" />
              <div className="bg-muted h-6 w-24 animate-pulse rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
