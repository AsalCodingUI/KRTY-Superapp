import { Skeleton } from "@/shared/ui"

export default function PayrollLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Skeleton className="h-8 w-48" />

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="border-neutral-primary bg-surface-neutral-primary space-y-3 rounded-lg border p-6"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Table section */}
      <div className="border-neutral-primary bg-surface-neutral-primary overflow-hidden rounded-lg border">
        {/* Table header */}
        <div className="border-neutral-primary flex items-center justify-between border-b p-4">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>

        {/* Table rows */}
        <div className="divide-border-neutral-primary divide-y">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
