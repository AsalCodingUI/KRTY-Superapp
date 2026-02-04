import { cx } from "@/shared/lib/utils"

interface SkeletonProps {
  className?: string
}

/**
 * Skeleton component for loading states.
 * Uses a pulse animation.
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-[250px]" />
 * ```
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cx(
        "bg-surface-neutral-secondary animate-pulse rounded-md",
        className,
      )}
    />
  )
}

// Preset skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="bg-surface space-y-3 rounded-lg p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-surface space-y-4 rounded-lg p-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="bg-surface overflow-hidden rounded-lg">
      <div className="border-border border-b p-4">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="divide-border divide-y">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonList() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
