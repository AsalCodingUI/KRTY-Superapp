import { Skeleton } from "@/components/ui"

export default function CalendarLoading() {
  return (
    <div className="flex h-full gap-4 lg:gap-6">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 flex-shrink-0 space-y-4 lg:block">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>

      {/* Main calendar skeleton */}
      <div className="flex flex-1 flex-col space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>

        {/* Calendar grid */}
        <div className="border-border-border flex-1 overflow-hidden rounded-lg border">
          {/* Header row */}
          <div className="border-border-border grid grid-cols-7 border-b">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="border-border-border border-r p-2 last:border-r-0"
              >
                <Skeleton className="mx-auto h-4 w-8" />
              </div>
            ))}
          </div>

          {/* Calendar rows */}
          {[...Array(5)].map((_, row) => (
            <div
              key={row}
              className="border-border-border grid grid-cols-7 border-b last:border-b-0"
            >
              {[...Array(7)].map((_, col) => (
                <div
                  key={col}
                  className="border-border-border h-24 border-r p-2 last:border-r-0"
                >
                  <Skeleton className="mb-2 h-4 w-6" />
                  {row % 2 === 0 && col % 3 === 0 && (
                    <Skeleton className="h-5 w-full rounded" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
