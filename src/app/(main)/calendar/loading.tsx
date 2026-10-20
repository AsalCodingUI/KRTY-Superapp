import { Skeleton } from "@/components/ui/skeleton"
import { CalendarSkeleton } from "@/widgets/event-calendar/ui/components/CalendarSkeleton"

/** Mirrors the calendar page: toolbar + one bordered calendar surface. */
export default function CalendarLoading() {
  return (
    <div className="flex h-[calc(100svh-4rem)] min-h-[520px] flex-col gap-4 pt-1">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-8" />
          <Skeleton className="size-8" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="bg-sidebar flex min-h-0 flex-1 overflow-hidden rounded-xl border">
        <CalendarSkeleton />
      </div>
    </div>
  )
}
