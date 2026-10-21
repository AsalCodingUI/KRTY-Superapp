import { Skeleton } from "@/components/ui/skeleton"

export default function PerformanceLoading() {
  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex gap-6">
          {[56, 80, 72].map((w) => (
            <Skeleton key={w} className="h-5" style={{ width: w }} />
          ))}
        </div>
        <Skeleton className="h-8 w-72" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
