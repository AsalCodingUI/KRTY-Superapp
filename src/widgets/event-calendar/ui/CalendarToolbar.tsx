"use client"

import { Button } from "@/components/ui"
import { cx } from "@/shared/lib/utils"
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiLayout2Line,
  RiLayoutGridLine,
  RiLayoutRowLine,
  RiListCheck2,
} from "@remixicon/react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { useMemo } from "react"
import { useCalendarContext } from "./calendar-context"
import type { ViewMode } from "./types"
import { formatDateRange } from "./utils"

interface CalendarToolbarProps {
  onAddEvent: () => void
}

export function CalendarToolbar({ onAddEvent }: CalendarToolbarProps) {
  const {
    currentDate,
    viewMode,
    setViewMode,
    goToToday,
    goToNext,
    goToPrevious,
  } = useCalendarContext()

  const dateRangeText = useMemo(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy", { locale: id })
    } else if (viewMode === "week") {
      return formatDateRange(currentDate, currentDate, viewMode)
    } else if (viewMode === "day") {
      return format(currentDate, "EEEE, dd MMMM yyyy", { locale: id })
    }
    return "Agenda"
  }, [currentDate, viewMode])

  const viewButtons: {
    mode: ViewMode
    icon: typeof RiLayoutGridLine
    label: string
  }[] = [
    { mode: "month", icon: RiLayoutGridLine, label: "Bulan" },
    { mode: "week", icon: RiLayout2Line, label: "Minggu" },
    { mode: "day", icon: RiLayoutRowLine, label: "Hari" },
    { mode: "agenda", icon: RiListCheck2, label: "Agenda" },
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Left: New Event button and navigation */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onAddEvent}
          size="default"
          className="hover:bg-surface-brand hover:ring-primary"
        >
          <RiAddLine className="mr-2 h-4 w-4" />
          New Event
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="default"
            onClick={goToToday}
            className="hover:bg-surface hover:ring-border"
          >
            Hari Ini
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="default"
              onClick={goToPrevious}
              className="hover:bg-surface hover:ring-border"
            >
              <RiArrowLeftSLine className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="default"
              onClick={goToNext}
              className="hover:bg-surface hover:ring-border"
            >
              <RiArrowRightSLine className="h-4 w-4" />
            </Button>
          </div>
          <h2 className="text-content text-label-md ml-2 min-w-[150px]">
            {dateRangeText}
          </h2>
        </div>
      </div>

      {/* Right: View mode selector */}
      <div className="flex items-center gap-3">
        {/* View mode selector - matching QuarterFilter style */}
        <div className="bg-muted inline-flex items-center rounded-md">
          {viewButtons.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              onClick={() => setViewMode(mode)}
              variant={viewMode === mode ? "secondary" : "ghost"}
              size="default"
              className={cx(
                "font-medium",
                viewMode !== mode &&
                  "text-content-muted dark:text-foreground-default-disable",
                viewMode === mode && "hover:bg-surface hover:ring-border",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
