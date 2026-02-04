"use client";

import { useMemo, useState } from 'react';
import { AgendaView } from './agenda-view';
import { useCalendarContext } from './calendar-context';
import { CalendarDndProvider } from './calendar-dnd-context';
import { CalendarSidebar } from './calendar-sidebar';
import { DayView } from './day-view';
import { EventDialog } from './event-dialog';
import { GoogleCalendarProvider } from './google-calendar-context';
import { EventVisibilityProvider, useEventVisibility } from './hooks/use-event-visibility';
import { MonthView } from './month-view';
import type { CalendarEvent, EventCategory } from './types';
import { WeekView } from './week-view';

export interface EventCalendarProps {
    events: CalendarEvent[];
    onEventAdd?: (event: Partial<CalendarEvent>) => Promise<void>;
    onEventUpdate?: (event: CalendarEvent) => Promise<void>;
    onEventDelete?: (eventId: string) => Promise<void>;
    categories?: EventCategory[];
    canEdit?: boolean;
    // Optional external control for dialog
    dialogOpen?: boolean;
    onDialogOpenChange?: (open: boolean) => void;
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
    events: CalendarEvent[];
    onEventAdd?: (event: Partial<CalendarEvent>) => Promise<void>;
    onEventUpdate: (event: CalendarEvent) => Promise<void>;
    onEventDelete?: (eventId: string) => Promise<void>;
    canEdit: boolean;
    externalDialogOpen?: boolean;
    onExternalDialogClose?: () => void;
}) {
    const { viewMode } = useCalendarContext();
    const { isColorVisible } = useEventVisibility();
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogInitialDate, setDialogInitialDate] = useState<Date | undefined>();
    const [isViewMode, setIsViewMode] = useState(false);

    // Handle external dialog trigger (from toolbar button)
    const isDialogOpen = dialogOpen || !!(externalDialogOpen && !selectedEvent);

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setIsViewMode(false); // Reset view mode when closing
            if (onExternalDialogClose) {
                onExternalDialogClose();
            }
        }
    };

    // Filter events by visible colors
    const visibleEvents = useMemo(() => {
        return events.filter((event) => isColorVisible(event.color));
    }, [events, isColorVisible]);

    const handleEventClick = (event: CalendarEvent) => {
        // if (!canEdit) return; // Allow viewing details in read-only mode
        setSelectedEvent(event);
        setIsViewMode(true); // Open in view mode when clicking an event
        setDialogOpen(true);
    };

    const handleSlotClick = (date: Date) => {
        if (!canEdit) return;
        setSelectedEvent(null);
        setIsViewMode(false); // Create mode
        setDialogInitialDate(date);
        setDialogOpen(true);
    };

    const handleDayClick = (date: Date) => {
        if (!canEdit) return;
        setSelectedEvent(null);
        setIsViewMode(false); // Create mode
        setDialogInitialDate(date);
        setDialogOpen(true);
    };

    // Handle save - for both add and update
    const handleSave = async (eventData: Partial<CalendarEvent>) => {
        if (selectedEvent) {
            // Update existing event
            await onEventUpdate({ ...selectedEvent, ...eventData } as CalendarEvent);
        } else if (onEventAdd) {
            // Add new event
            await onEventAdd(eventData);
        }
        setDialogOpen(false);
        setIsViewMode(false);
    };

    return (
        <>
            <div className="flex-1 min-h-0 overflow-auto">
                {viewMode === 'month' && (
                    <MonthView
                        events={visibleEvents}
                        onEventClick={handleEventClick}
                        onDayClick={handleDayClick}
                    />
                )}
                {viewMode === 'week' && (
                    <WeekView
                        events={visibleEvents}
                        onEventClick={handleEventClick}
                        onSlotClick={handleSlotClick}
                        canEdit={canEdit}
                    />
                )}
                {viewMode === 'day' && (
                    <DayView
                        events={visibleEvents}
                        onEventClick={handleEventClick}
                        onSlotClick={handleSlotClick}
                        canEdit={canEdit}
                    />
                )}
                {viewMode === 'agenda' && (
                    <AgendaView events={visibleEvents} onEventClick={handleEventClick} />
                )}
            </div>

            <EventDialog
                open={isDialogOpen}
                onOpenChange={handleDialogClose}
                event={selectedEvent}
                initialDate={dialogInitialDate}
                onDelete={onEventDelete}
                onSave={handleSave}
                readOnly={!canEdit || !!selectedEvent?.googleEventId || isViewMode}
            />
        </>
    );
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
            await onEventUpdate(event);
        }
    };

    const handleExternalDialogClose = () => {
        if (onDialogOpenChange) {
            onDialogOpenChange(false);
        }
    };

    return (
        <GoogleCalendarProvider>
            <EventVisibilityProvider initialCategories={categories}>
                <CalendarDndProvider events={events} onEventUpdate={handleEventUpdate}>
                    <div className="flex h-full bg-surface gap-4 lg:gap-6 overflow-hidden">
                        {/* Sidebar with mini calendar */}
                        <CalendarSidebar />

                        {/* Main calendar area */}
                        <div className="flex flex-col flex-1 h-full overflow-hidden">
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
        </GoogleCalendarProvider>
    );
}
