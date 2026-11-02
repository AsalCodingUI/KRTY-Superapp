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
import { useRef } from "react"
import { useCalendarContext } from "./calendar-context"
import { useToolbarMenu } from "./calendar-menu"
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
        {/* Icon only on phones, where the toolbar row is tight. */}
        <span className="max-sm:sr-only">{t("filterButton")}</span>
        {hidden > 0 && (
          <span className="text-muted-foreground tabular-nums max-sm:hidden">
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
  const { categories, toggleCategory } = useEventVisibility()
  // Right-click: new event, today / previous / next, go to a date, the
  // view, which calendars show.
  const rootRef = useRef<HTMLDivElement>(null)
  const pickDialog = useToolbarMenu(rootRef, {
    views,
    viewLabel: (view) => t(VIEW_LABELS[view]),
    onViewChange: handleViewChange,
    onAddEvent,
    canAdd: showAddEvent,
    categories,
    toggleCategory,
  })

  return (
    // One row on wide screens: views | date + nav | filter + add. On
    // phones two: views with filter + add, then the date with the nav, so
    // nothing gets squeezed or pushed off the edge.
    <div ref={rootRef} className="flex flex-wrap items-center gap-x-4 gap-y-3">
      {pickDialog}
      <SegmentedControl<ViewMode>
        fitContent
        items={viewItems}
        value={value}
        onChange={handleViewChange}
      />

      <div className="flex items-center gap-1 max-sm:order-last max-sm:w-full sm:ml-auto">
        <span className="mr-2 truncate text-sm font-medium whitespace-nowrap tabular-nums max-sm:mr-auto">
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
      </div>

      <div className="flex items-center gap-1 max-sm:ml-auto">
        <div className="bg-border mr-2 h-4 w-px max-sm:hidden" />
        <CalendarFilter />
        {showGoogleStatus && (
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="flex size-8 items-center justify-center max-sm:hidden" />
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
          <Button
            onClick={onAddEvent}
            className="ml-1 max-sm:size-8 max-sm:px-0"
            aria-label={t("toolbarNewEvent")}
          >
            <RiAddLine data-icon="inline-start" className="max-sm:m-0" />
            <span className="max-sm:sr-only">{t("toolbarNewEvent")}</span>
          </Button>
        )}
      </div>
    </div>
  )
}
