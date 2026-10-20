"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from "@/shared/ui/lucide-icons"
import { useCalendarContext } from "./calendar-context"
import { useGoogleCalendar } from "./hooks/use-google-calendar"
import type { ViewMode } from "./types"

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
  const { viewMode, setViewMode, goToToday, goToNext, goToPrevious } =
    useCalendarContext()
  const { isConnected, isLoading } = useGoogleCalendar()
  const handleViewChange = onViewChange ?? setViewMode

  const viewOptions = [
    { value: "month", label: "Bulan" },
    { value: "week", label: "Minggu" },
    { value: "day", label: "Hari" },
    { value: "agenda", label: "Agenda" },
  ] satisfies Array<{
    value: ViewMode
    label: string
  }>
  const currentViewLabel =
    viewOptions.find((option) => option.value === viewMode)?.label ?? "Bulan"

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                type="button"
                className="flex items-center gap-1"
              />
            }
          >
            <span>{currentViewLabel}</span>
            <RiArrowDownSLine className="text-muted-foreground size-4 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={viewMode}
              onValueChange={(value) => handleViewChange(value as ViewMode)}
            >
              {viewOptions.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <RiArrowLeftSLine className="size-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hari Ini
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <RiArrowRightSLine className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-muted-foreground text-sm font-medium">
            Google Kalender
          </span>
          {isLoading ? (
            <Badge variant="secondary">Mengecek</Badge>
          ) : isConnected ? (
            <Badge variant="success">Terhubung</Badge>
          ) : (
            <Badge variant="secondary">Terputus</Badge>
          )}
        </div>
        {showAddEvent && (
          <Button onClick={onAddEvent}>
            <RiAddLine data-icon="inline-start" />
            Jadwal Baru
          </Button>
        )}
      </div>
    </div>
  )
}
