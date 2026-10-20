"use client"

import { SegmentedControl } from "@/components/segmented-control"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cx } from "@/shared/lib/utils"
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiEqualizer2Line,
} from "@/shared/ui/lucide-icons"
import { format, isSameMonth, isSameYear } from "date-fns"
import { id } from "date-fns/locale"
import { useCalendarContext } from "./calendar-context"
import { useGoogleCalendar } from "./hooks/use-google-calendar"
import { useEventVisibility } from "./hooks/use-event-visibility"
import type { EventColor, ViewMode } from "./types"
import { getViewRange } from "./utils"

const VIEW_OPTIONS = [
  { value: "week", label: "Minggu" },
  { value: "month", label: "Bulan" },
  { value: "timeline", label: "Timeline" },
] satisfies { value: ViewMode; label: string }[]

const DOT: Record<EventColor, string> = {
  blue: "bg-primary",
  violet: "bg-primary",
  cyan: "bg-info",
  emerald: "bg-success",
  rose: "bg-destructive",
  orange: "bg-warning",
  amber: "bg-warning",
  neutral: "bg-muted-foreground",
}

/** "19 – 25 Okt 2026", "Oktober 2026" or "Sep – Nov 2026". */
function rangeLabel(date: Date, view: ViewMode) {
  if (view === "month") return format(date, "MMMM yyyy", { locale: id })
  const { start, end } = getViewRange(date, view)
  if (view === "timeline") {
    return `${format(start, "MMM", { locale: id })} – ${format(end, "MMM yyyy", { locale: id })}`
  }
  if (isSameMonth(start, end)) {
    return `${format(start, "d")} – ${format(end, "d MMM yyyy", { locale: id })}`
  }
  return isSameYear(start, end)
    ? `${format(start, "d MMM", { locale: id })} – ${format(end, "d MMM yyyy", { locale: id })}`
    : `${format(start, "d MMM yyyy", { locale: id })} – ${format(end, "d MMM yyyy", { locale: id })}`
}

/** Category toggles (was the left legend). */
function CalendarFilter() {
  const { categories, toggleColor } = useEventVisibility()
  const hidden = categories.filter((c) => !c.isActive).length
  if (categories.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" aria-label="Filter kalender" />}
      >
        <RiEqualizer2Line data-icon="inline-start" />
        Kalender
        {hidden > 0 && (
          <span className="text-muted-foreground tabular-nums">
            {categories.length - hidden}/{categories.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 gap-0 p-1">
        {categories.map((category) => (
          <label
            key={category.id}
            className="hover:bg-accent flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
          >
            <Checkbox
              checked={category.isActive}
              onCheckedChange={() => toggleColor(category.color)}
            />
            <span
              className={cx(
                "size-2 shrink-0 rounded-[3px]",
                DOT[category.color],
              )}
            />
            <span className="truncate">{category.name}</span>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  )
}

interface CalendarToolbarProps {
  onAddEvent: () => void
  showAddEvent?: boolean
  onViewChange?: (view: ViewMode) => void
}

export function CalendarToolbar({
  onAddEvent,
  showAddEvent = true,
  onViewChange,
}: CalendarToolbarProps) {
  const {
    currentDate,
    viewMode,
    setViewMode,
    goToToday,
    goToNext,
    goToPrevious,
  } = useCalendarContext()
  const { isConnected, isLoading } = useGoogleCalendar()
  const handleViewChange = onViewChange ?? setViewMode
  // Day/agenda are still reachable by URL; the switch shows the three main ones.
  const value = VIEW_OPTIONS.some((o) => o.value === viewMode)
    ? viewMode
    : "week"

  return (
    <div className="flex items-center justify-between gap-4">
      <SegmentedControl<ViewMode>
        fitContent
        items={VIEW_OPTIONS}
        value={value}
        onChange={handleViewChange}
      />

      <div className="flex items-center gap-1">
        <span className="mr-2 text-sm font-medium tabular-nums">
          {rangeLabel(currentDate, viewMode)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          aria-label="Sebelumnya"
        >
          <RiArrowLeftSLine />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          aria-label="Berikutnya"
        >
          <RiArrowRightSLine />
        </Button>
        <Button variant="outline" onClick={goToToday} className="ml-1">
          Hari Ini
        </Button>

        <div className="bg-border mx-2 h-4 w-px" />

        <CalendarFilter />
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="flex size-8 items-center justify-center" />
            }
          >
            <span
              className={cx(
                "size-2 rounded-full",
                isLoading
                  ? "bg-muted-foreground"
                  : isConnected
                    ? "bg-success"
                    : "bg-destructive",
              )}
            />
          </TooltipTrigger>
          <TooltipContent>
            Google Kalender{" "}
            {isLoading ? "dicek…" : isConnected ? "terhubung" : "terputus"}
          </TooltipContent>
        </Tooltip>

        {showAddEvent && (
          <Button onClick={onAddEvent} className="ml-1">
            <RiAddLine data-icon="inline-start" />
            Jadwal Baru
          </Button>
        )}
      </div>
    </div>
  )
}
