"use client"

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui"
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
}

export function CalendarToolbar({ onAddEvent }: CalendarToolbarProps) {
  const { viewMode, setViewMode, goToToday, goToNext, goToPrevious } =
    useCalendarContext()
  const { isConnected, isLoading } = useGoogleCalendar()

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
    <div className="flex flex-wrap items-center justify-between gap-md">
      <div className="flex items-center gap-xl">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              trailingIcon={<RiArrowDownSLine />}
            >
              {currentViewLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode)}
            >
              {viewOptions.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  iconType="check"
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="h-3 border-l border-neutral-primary" />
        <div className="flex items-center gap-2">
          <span className="text-label-sm text-foreground-secondary">
            Google Calendar
          </span>
          {isLoading ? (
            <Badge variant="zinc">Checking</Badge>
          ) : isConnected ? (
            <Badge variant="success">Connected</Badge>
          ) : (
            <Badge variant="zinc">Disconnected</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-md">
        <div className="flex items-center gap-sm">
          <Button variant="secondary" size="icon-sm" onClick={goToPrevious}>
            <RiArrowLeftSLine className="size-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="secondary" size="icon-sm" onClick={goToNext}>
            <RiArrowRightSLine className="size-4" />
          </Button>
        </div>
        <Button size="sm" leadingIcon={<RiAddLine />} onClick={onAddEvent}>
          New Event
        </Button>
      </div>
    </div>
  )
}
