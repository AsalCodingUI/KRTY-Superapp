import { Skeleton } from "@/shared/ui"

export default function MessageLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Message list */}
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="border-neutral-primary bg-surface-neutral-primary flex items-start gap-4 rounded-lg border p-4"
          >
            <Skeleton className="h-10 w-10 flex-shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
