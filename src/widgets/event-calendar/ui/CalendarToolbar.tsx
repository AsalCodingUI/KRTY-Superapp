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
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format, isSameMonth, isSameYear, type Locale } from "date-fns"
import { useCalendarContext } from "./calendar-context"
import { useGoogleCalendar } from "./hooks/use-google-calendar"
import { useEventVisibility } from "./hooks/use-event-visibility"
import type { EventColor, ViewMode } from "./types"
import { getViewRange } from "./utils"

const VIEW_OPTIONS = [
  { value: "week", labelKey: "viewWeek" },
  { value: "month", labelKey: "viewMonth" },
  { value: "timeline", labelKey: "viewTimeline" },
] satisfies {
  value: ViewMode
  labelKey: "viewWeek" | "viewMonth" | "viewTimeline"
}[]

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
function rangeLabel(date: Date, view: ViewMode, locale: Locale) {
  if (view === "month") return format(date, "MMMM yyyy", { locale })
  const { start, end } = getViewRange(date, view)
  if (view === "timeline") {
    return `${format(start, "MMM", { locale })} – ${format(end, "MMM yyyy", { locale })}`
  }
  if (isSameMonth(start, end)) {
    return `${format(start, "d")} – ${format(end, "d MMM yyyy", { locale })}`
  }
  return isSameYear(start, end)
    ? `${format(start, "d MMM", { locale })} – ${format(end, "d MMM yyyy", { locale })}`
    : `${format(start, "d MMM yyyy", { locale })} – ${format(end, "d MMM yyyy", { locale })}`
}

/** Category toggles (was the left legend). */
function CalendarFilter() {
  const t = useT("calendar")
  const { categories, toggleColor } = useEventVisibility()
  const hidden = categories.filter((c) => !c.isActive).length
  if (categories.length === 0) return null

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" aria-label={t("filterAriaLabel")} />}
      >
        <RiEqualizer2Line data-icon="inline-start" />
        {t("filterButton")}
        {hidden > 0 && (
          <span className="text-muted-foreground tabular-nums">
            {categories.length - hidden}/{categories.length}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="nest-rounded-2xl nest-p-2 w-56 gap-0 rounded-2xl p-2"
      >
        {categories.map((category) => (
          <label
            key={category.id}
            className="hover:bg-accent rounded-nested flex cursor-pointer items-center gap-2.5 px-2 py-1.5 text-sm"
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
  const t = useT("calendar")
  const dateLocale = useDateLocale()
  const viewItems = VIEW_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }))
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
        items={viewItems}
        value={value}
        onChange={handleViewChange}
      />

      <div className="flex items-center gap-1">
        <span className="mr-2 text-sm font-medium tabular-nums">
          {rangeLabel(currentDate, viewMode, dateLocale)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevious}
          aria-label={t("toolbarPrevious")}
        >
          <RiArrowLeftSLine />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          aria-label={t("toolbarNext")}
        >
          <RiArrowRightSLine />
        </Button>
        <Button variant="outline" onClick={goToToday} className="ml-1">
          {t("toolbarToday")}
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
            {isLoading
              ? t("googleStatusChecking")
              : isConnected
                ? t("googleStatusConnected")
                : t("googleStatusDisconnected")}
          </TooltipContent>
        </Tooltip>

        {showAddEvent && (
          <Button onClick={onAddEvent} className="ml-1">
            <RiAddLine data-icon="inline-start" />
            {t("toolbarNewEvent")}
          </Button>
        )}
      </div>
    </div>
  )
}
