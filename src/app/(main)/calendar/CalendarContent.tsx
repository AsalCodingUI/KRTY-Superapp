"use client";

import { useKeyboardShortcuts } from '@/shared/hooks/useKeyboardShortcuts';
import {
    CalendarSkeleton,
    CalendarToolbar,
    EmptyState,
    EventCalendar,
    useCalendarContext,
    type CalendarEvent,
    type EventCategory
} from '@/widgets/event-calendar';

// Separate component to use useCalendarContext
function CalendarContent({
    events,
    loading,
    dialogOpen,
    setDialogOpen,
    handleEventAdd,
    handleEventUpdate,
    handleEventDelete,
    isStakeholder,
    categories,
}: {
    events: CalendarEvent[];
    loading: boolean;
    dialogOpen: boolean;
    setDialogOpen: (open: boolean) => void;
    handleEventAdd: (eventData: Partial<CalendarEvent>) => Promise<void>;
    handleEventUpdate: (eventData: Partial<CalendarEvent>) => Promise<void>;
    handleEventDelete: (eventId: string) => Promise<void>;
    isStakeholder: boolean;
    categories: EventCategory[];
}) {
    const { goToToday, goToNext, goToPrevious, setViewMode } = useCalendarContext();

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onCreateEvent: () => setDialogOpen(true),
        onGoToday: goToToday,
        onPrevious: goToPrevious,
        onNext: goToNext,
        onViewChange: setViewMode,
    });

    return (
        <div className="flex flex-col flex-1 min-h-0 gap-6">
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
            {/* EventDialog is now handled inside EventCalendar component to avoid duplication */}
        </div>
    );
}

export { CalendarContent };
