import { Skeleton } from "@/components/ui/skeleton"

export default function PerformanceLoading() {
  return (
    <div className="flex flex-col">
      <div className="flex items-end justify-between pt-6 pb-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="bleed gutter-x border-border flex gap-6 border-b pb-3">
        {[56, 80, 72].map((w) => (
          <Skeleton key={w} className="h-5" style={{ width: w }} />
        ))}
      </div>
      <div className="bleed gutter-x border-border flex gap-10 border-b py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-4 h-64 w-full" />
    </div>
  )
}
