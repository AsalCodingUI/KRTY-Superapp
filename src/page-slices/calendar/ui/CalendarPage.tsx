"use client"

import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts"
import type { CalendarEvent, EventCategory } from "@/widgets/event-calendar"
import {
  CalendarSkeleton,
  CalendarToolbar,
  EmptyState,
  EventCalendar,
  useCalendarContext,
} from "@/widgets/event-calendar"

interface CalendarPageProps {
  events: CalendarEvent[]
  loading: boolean
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  handleEventAdd: (eventData: Partial<CalendarEvent>) => Promise<void>
  handleEventUpdate: (eventData: Partial<CalendarEvent>) => Promise<void>
  handleEventDelete: (eventId: string) => Promise<void>
  isStakeholder: boolean
  categories: EventCategory[]
}

export function CalendarPage({
  events,
  loading,
  dialogOpen,
  setDialogOpen,
  handleEventAdd,
  handleEventUpdate,
  handleEventDelete,
  isStakeholder,
  categories,
}: CalendarPageProps) {
  const { goToToday, goToNext, goToPrevious, setViewMode } =
    useCalendarContext()

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onCreateEvent: () => setDialogOpen(true),
    onGoToday: goToToday,
    onPrevious: goToPrevious,
    onNext: goToNext,
    onViewChange: setViewMode,
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <CalendarToolbar onAddEvent={() => setDialogOpen(true)} />

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <CalendarSkeleton />
        ) : events.length === 0 ? (
          <EmptyState onCreateEvent={() => setDialogOpen(true)} />
        ) : (
          <EventCalendar
            events={events}
            onEventAdd={handleEventAdd}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
            categories={categories}
            canEdit={isStakeholder}
            dialogOpen={dialogOpen}
            onDialogOpenChange={setDialogOpen}
          />
        )}
      </div>
    </div>
  )
}
