import { Skeleton } from "@/components/ui/skeleton"
import { cx } from "@/shared/lib/utils"
import { CalendarSkeleton } from "@/widgets/event-calendar/ui/components/CalendarSkeleton"
import { CALENDAR_HEIGHT } from "./calendar-height"

/** Mirrors the calendar page: toolbar + one bordered calendar surface. */
export default function CalendarLoading() {
  return (
    <div
      className={cx(CALENDAR_HEIGHT, "flex min-h-[520px] flex-col gap-4 pt-1")}
    >
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
      <div className="bg-background dark:bg-surface flex min-h-0 flex-1 overflow-hidden rounded-xl border">
        <CalendarSkeleton />
      </div>
    </div>
  )
}
