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

const VIEW_LABELS = {
  week: "viewWeek",
  month: "viewMonth",
  timeline: "viewTimeline",
  day: "viewDay",
  agenda: "viewAgenda",
} as const satisfies Record<ViewMode, string>

const DOT: Record<EventColor, string> = {
  blue: "bg-primary",
  violet: "bg-purple-9",
  cyan: "bg-info",
  pink: "bg-pink-9",
  teal: "bg-teal-9",
  emerald: "bg-success",
  rose: "bg-destructive",
  orange: "bg-warning",
  amber: "bg-warning",
  neutral: "bg-muted-foreground",
}

/** "19 – 25 Okt 2026", "Oktober 2026", "Sep – Nov 2026" or "Sel, 27 Okt". */
function rangeLabel(date: Date, view: ViewMode, locale: Locale) {
  if (view === "month") return format(date, "MMMM yyyy", { locale })
  // One day: "Sel, 27 Okt".
  if (view === "day" || view === "agenda")
    return format(date, "EEE, d MMM", { locale })
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
  const { categories, toggleCategory } = useEventVisibility()
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
              onCheckedChange={() => toggleCategory(category.id)}
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
  /** Views in the switch, in order (others stay reachable by URL). */
  views?: ViewMode[]
  /** Google connection dot (only the personal calendar reads Google). */
  showGoogleStatus?: boolean
}

export function CalendarToolbar({
  onAddEvent,
  showAddEvent = true,
  onViewChange,
  views = ["week", "month", "timeline"],
  showGoogleStatus = true,
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
  const viewItems = views.map((view) => ({
    value: view,
    label: t(VIEW_LABELS[view]),
  }))
  const { isConnected, isLoading } = useGoogleCalendar()
  const handleViewChange = onViewChange ?? setViewMode
  const value = views.includes(viewMode) ? viewMode : views[0]

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
        {showGoogleStatus && (
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
        )}

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
