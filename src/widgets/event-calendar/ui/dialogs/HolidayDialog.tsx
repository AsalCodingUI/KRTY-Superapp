"use client";

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { RiCalendarLine, RiCloseLine } from '@remixicon/react';
import { format } from 'date-fns';
import type { CalendarEvent } from '../types';

interface HolidayDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: CalendarEvent;
}

export function HolidayDialog({
    open,
    onOpenChange,
    event,
}: HolidayDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Public Holiday</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Holiday Title */}
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-semibold text-content break-words">
                                {event.title}
                            </h3>
                            <div className="badge-neutral whitespace-nowrap flex-shrink-0">
                                Holiday
                            </div>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                            <RiCalendarLine className="w-5 h-5 text-content-subtle" />
                            <div>
                                <p className="text-sm font-semibold text-content">
                                    {format(event.start, 'EEEE, dd MMMM yyyy')}
                                </p>
                                {event.allDay && (
                                    <p className="text-xs text-content-subtle mt-0.5">
                                        All day
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {event.description && (
                        <div className="space-y-2 border-t border-border pt-4">
                            <h4 className="text-sm font-semibold text-content">About this holiday</h4>
                            <p className="text-sm text-content-subtle whitespace-pre-wrap leading-relaxed break-words">
                                {event.description}
                            </p>
                        </div>
                    )}

                    {/* Info notice */}
                    <div className="alert-info">
                        <p className="text-sm">
                            ℹ️ This is a public holiday from the Indonesian calendar. It cannot be edited or deleted.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t border-border mt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                    >
                        <RiCloseLine className="w-4 h-4 mr-2" />
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
