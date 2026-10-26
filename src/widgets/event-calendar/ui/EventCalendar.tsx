"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { useCalendarContext } from "./calendar-context"
import { CalendarDndProvider } from "./calendar-dnd-context"
import {
  EventVisibilityProvider,
  useEventVisibility,
} from "./hooks/use-event-visibility"
import type { CalendarEvent, EventCategory } from "./types"
import { filterEventsByRange, getViewRange } from "./utils"
import { WeekView } from "./week-view"

// Week is the default view and stays in the main chunk; the other views and
// the event dialog load on demand.
const MonthView = dynamic(
  () => import("./month-view").then((m) => m.MonthView),
  { loading: () => null },
)
const DayView = dynamic(() => import("./day-view").then((m) => m.DayView), {
  loading: () => null,
})
const AgendaView = dynamic(
  () => import("./agenda-view").then((m) => m.AgendaView),
  { loading: () => null },
)
const EventDialog = dynamic(
  () => import("./event-dialog").then((m) => m.EventDialog),
  { loading: () => null },
)

export interface EventCalendarProps {
  events: CalendarEvent[]
  onEventAdd?: (event: Partial<CalendarEvent>) => Promise<void>
  onEventUpdate?: (event: CalendarEvent) => Promise<void>
  onEventDelete?: (eventId: string) => Promise<void>
  categories?: EventCategory[]
  /** May create events (slot clicks, the new-event dialog). */
  canEdit?: boolean
  /** May change this event (dialog edit, drag); defaults to `canEdit`. */
  canEditEvent?: (event: CalendarEvent) => boolean
  /** Return true when the click was handled (e.g. a task deadline opens
   *  its task) and the event dialog should stay closed. */
  onEventOpen?: (event: CalendarEvent) => boolean
  /** Types offered when creating an event (registry values). */
  eventTypes?: string[]
  /** The view in the "timeline" slot (only the project calendar has one). */
  timeline?: React.ReactNode
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
  canEditEvent = () => canEdit,
  onEventOpen,
  eventTypes,
  timeline,
  externalDialogOpen,
  onExternalDialogClose,
}: {
  events: CalendarEvent[]
  onEventAdd?: (event: Partial<CalendarEvent>) => Promise<void>
  onEventUpdate: (event: CalendarEvent) => Promise<void>
  onEventDelete?: (eventId: string) => Promise<void>
  canEdit: boolean
  canEditEvent?: (event: CalendarEvent) => boolean
  onEventOpen?: (event: CalendarEvent) => boolean
  eventTypes?: string[]
  timeline?: React.ReactNode
  externalDialogOpen?: boolean
  onExternalDialogClose?: () => void
}) {
  const { viewMode, currentDate } = useCalendarContext()
  const { isEventVisible } = useEventVisibility()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogInitialDate, setDialogInitialDate] = useState<Date | undefined>()

  // Handle external dialog trigger (from toolbar button)
  const isDialogOpen = dialogOpen || !!(externalDialogOpen && !selectedEvent)

  // Mount the (lazily loaded) dialog on first open, then keep it mounted so
  // close animations and state resets behave as before.
  const [dialogMounted, setDialogMounted] = useState(false)
  if (isDialogOpen && !dialogMounted) setDialogMounted(true)

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
    return rangeEvents.filter(isEventVisible)
  }, [events, isEventVisible, currentDate, viewMode])

  const handleEventClick = (event: CalendarEvent) => {
    if (onEventOpen?.(event)) return
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
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {viewMode === "month" && (
          <div className="h-full overflow-auto">
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
              canEditEvent={canEditEvent}
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
              canEditEvent={canEditEvent}
            />
          </div>
        )}
        {viewMode === "timeline" && (
          // The timeline scrolls itself (both axes, pinned header + labels).
          <div className="h-full">{timeline}</div>
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

      {dialogMounted && (
        <EventDialog
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          event={selectedEvent}
          initialDate={dialogInitialDate}
          onDelete={onEventDelete}
          onSave={handleSave}
          readOnly={
            selectedEvent
              ? !canEditEvent(selectedEvent) || !!selectedEvent.googleEventId
              : !canEdit
          }
          eventTypes={eventTypes}
        />
      )}
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
  canEditEvent,
  onEventOpen,
  eventTypes,
  timeline,
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
        <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
            <CalendarContent
              events={events}
              onEventAdd={onEventAdd}
              onEventUpdate={handleEventUpdate}
              onEventDelete={onEventDelete}
              canEdit={canEdit}
              canEditEvent={canEditEvent}
              onEventOpen={onEventOpen}
              eventTypes={eventTypes}
              timeline={timeline}
              externalDialogOpen={externalDialogOpen}
              onExternalDialogClose={handleExternalDialogClose}
            />
          </div>
        </div>
      </CalendarDndProvider>
    </EventVisibilityProvider>
  )
}
