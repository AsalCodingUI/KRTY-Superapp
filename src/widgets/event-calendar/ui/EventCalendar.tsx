"use client"

import { useMemo, useState } from "react"
import { AgendaView } from "./agenda-view"
import { useCalendarContext } from "./calendar-context"
import { CalendarDndProvider } from "./calendar-dnd-context"
import { CalendarSidebar } from "./calendar-sidebar"
import { DayView } from "./day-view"
import { EventDialog } from "./event-dialog"
import {
  EventVisibilityProvider,
  useEventVisibility,
} from "./hooks/use-event-visibility"
import { MonthView } from "./month-view"
import type { CalendarEvent, EventCategory } from "./types"
import { filterEventsByRange, getViewRange } from "./utils"
import { WeekView } from "./week-view"

export interface EventCalendarProps {
  events: CalendarEvent[]
  onEventAdd?: (event: Partial<CalendarEvent>) => Promise<void>
  onEventUpdate?: (event: CalendarEvent) => Promise<void>
  onEventDelete?: (eventId: string) => Promise<void>
  categories?: EventCategory[]
  canEdit?: boolean
  // Optional external control for dialog
  dialogOpen?: boolean
  onDialogOpenChange?: (open: boolean) => void
}

function CalendarContent({
  events,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  canEdit,
  externalDialogOpen,
  onExternalDialogClose,
}: {
  events: CalendarEvent[]
  onEventAdd?: (event: Partial<CalendarEvent>) => Promise<void>
  onEventUpdate: (event: CalendarEvent) => Promise<void>
  onEventDelete?: (eventId: string) => Promise<void>
  canEdit: boolean
  externalDialogOpen?: boolean
  onExternalDialogClose?: () => void
}) {
  const { viewMode, currentDate } = useCalendarContext()
  const { isColorVisible } = useEventVisibility()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogInitialDate, setDialogInitialDate] = useState<Date | undefined>()

  // Handle external dialog trigger (from toolbar button)
  const isDialogOpen = dialogOpen || !!(externalDialogOpen && !selectedEvent)

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      if (onExternalDialogClose) {
        onExternalDialogClose()
      }
    }
  }

  // Filter events by visible range + visible colors
  const visibleEvents = useMemo(() => {
    const range = getViewRange(currentDate, viewMode)
    const rangeEvents = filterEventsByRange(events, range.start, range.end)
    return rangeEvents.filter((event) => isColorVisible(event.color))
  }, [events, isColorVisible, currentDate, viewMode])

  const handleEventClick = (event: CalendarEvent) => {
    // if (!canEdit) return; // Allow viewing details in read-only mode
    setSelectedEvent(event)
    setDialogOpen(true)
  }

  const handleSlotClick = (date: Date) => {
    if (!canEdit) return
    setSelectedEvent(null)
    setDialogInitialDate(date)
    setDialogOpen(true)
  }

  const handleDayClick = (date: Date) => {
    if (!canEdit) return
    setSelectedEvent(null)
    setDialogInitialDate(date)
    setDialogOpen(true)
  }

  // Handle save - for both add and update
  const handleSave = async (eventData: Partial<CalendarEvent>) => {
    if (selectedEvent) {
      // Update existing event
      await onEventUpdate({ ...selectedEvent, ...eventData } as CalendarEvent)
    } else if (onEventAdd) {
      // Add new event
      await onEventAdd(eventData)
    }
    setDialogOpen(false)
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-hidden">
        {viewMode === "month" && (
          <div className="h-full">
            <MonthView
              events={visibleEvents}
              onEventClick={handleEventClick}
              onDayClick={handleDayClick}
            />
          </div>
        )}
        {viewMode === "week" && (
          <div className="h-full overflow-auto">
            <WeekView
              events={visibleEvents}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              canEdit={canEdit}
            />
          </div>
        )}
        {viewMode === "day" && (
          <div className="h-full overflow-auto">
            <DayView
              events={visibleEvents}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              canEdit={canEdit}
            />
          </div>
        )}
        {viewMode === "agenda" && (
          <div className="h-full overflow-auto">
            <AgendaView
              events={visibleEvents}
              onEventClick={handleEventClick}
            />
          </div>
        )}
      </div>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        event={selectedEvent}
        initialDate={dialogInitialDate}
        onDelete={onEventDelete}
        onSave={handleSave}
        readOnly={!canEdit || !!selectedEvent?.googleEventId}
      />
    </>
  )
}

export function EventCalendar({
  events,
  onEventAdd,
  onEventUpdate,
  onEventDelete,
  categories = [],
  canEdit = true,
  dialogOpen: externalDialogOpen,
  onDialogOpenChange,
}: EventCalendarProps) {
  const handleEventUpdate = async (event: CalendarEvent) => {
    if (onEventUpdate) {
      await onEventUpdate(event)
    }
  }

  const handleExternalDialogClose = () => {
    if (onDialogOpenChange) {
      onDialogOpenChange(false)
    }
  }

  return (
    <EventVisibilityProvider initialCategories={categories}>
      <CalendarDndProvider events={events} onEventUpdate={handleEventUpdate}>
        <div className="bg-surface flex h-full w-full flex-1 min-w-0 gap-4 overflow-hidden lg:gap-6">
          {/* Sidebar with mini calendar */}
          <CalendarSidebar />

          {/* Main calendar area */}
          <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
            <CalendarContent
              events={events}
              onEventAdd={onEventAdd}
              onEventUpdate={handleEventUpdate}
              onEventDelete={onEventDelete}
              canEdit={canEdit}
              externalDialogOpen={externalDialogOpen}
              onExternalDialogClose={handleExternalDialogClose}
            />
          </div>
        </div>
      </CalendarDndProvider>
    </EventVisibilityProvider>
  )
}
