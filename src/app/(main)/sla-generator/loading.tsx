import { Skeleton } from "@/components/ui"

export default function SLAGeneratorLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      {/* Main content - two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column - Form */}
        <div className="space-y-6">
          <div className="bg-surface border-border-border space-y-4 rounded-lg border p-6">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border-border-border space-y-4 rounded-lg border p-6">
            <Skeleton className="h-6 w-32" />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border-border-border flex items-center gap-4 rounded border p-3"
              >
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Right column - Preview */}
        <div className="bg-surface border-border-border space-y-6 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>

          {/* A4 preview skeleton */}
          <div className="border-border-border aspect-[210/297] space-y-6 rounded-md border bg-surface p-8">
            <Skeleton className="mx-auto h-8 w-3/4" />
            <Skeleton className="mx-auto h-4 w-1/2" />
            <div className="space-y-3 pt-8">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
