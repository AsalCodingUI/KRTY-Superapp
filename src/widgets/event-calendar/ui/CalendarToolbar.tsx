"use client"

import { Button } from "@/components/ui"
import { SegmentedControl } from "@/shared/ui/interaction/SegmentedControl"
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

  const viewButtons = [
    { value: "month", label: "Bulan", leadingIcon: RiLayoutGridLine },
    { value: "week", label: "Minggu", leadingIcon: RiLayout2Line },
    { value: "day", label: "Hari", leadingIcon: RiLayoutRowLine },
    { value: "agenda", label: "Agenda", leadingIcon: RiListCheck2 },
  ] satisfies Array<{
    value: ViewMode
    label: string
    leadingIcon: typeof RiLayoutGridLine
  }>

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
        <SegmentedControl
          items={viewButtons}
          value={viewMode}
          onChange={setViewMode}
          fitContent
          className="w-auto"
        />
      </div>
    </div>
  )
}
