"use client";

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { logError } from "@/shared/lib/utils/logger";
import { cx } from '@/shared/lib/utils';
import { RiCalendarLine, RiCloseLine, RiDeleteBinLine, RiMapPinLine } from '@remixicon/react';
import { format } from 'date-fns';
import { useState } from 'react';
import { CopyEventButton } from '../components/CopyEventButton';
import { GuestList } from '../components/GuestList';
import { MeetingButton } from '../components/MeetingButton';
import { RSVPButtons } from '../components/RSVPButtons';
import { getEventColorClasses } from '../event-color-registry';
import type { CalendarEvent } from '../types';

interface MeetingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: CalendarEvent;
    onDelete?: (eventId: string) => Promise<void>;
    onRSVPChange?: (eventId: string, status: 'yes' | 'no' | 'maybe') => Promise<void>;
}

export function MeetingDialog({
    open,
    onOpenChange,
    event,
    onDelete,
    onRSVPChange,
}: MeetingDialogProps) {
    const [loading, setLoading] = useState(false);
    const [rsvpStatus, setRsvpStatus] = useState<'yes' | 'no' | 'maybe' | undefined>(event.rsvpStatus);

    const [isDeletePending, setIsDeletePending] = useState(false);

    const handleDeleteClick = () => {
        setIsDeletePending(true);
    };

    const handleCancelDelete = () => {
        setIsDeletePending(false);
    };

    const handleConfirmDelete = async () => {
        if (!onDelete) return;
        setLoading(true);
        try {
            await onDelete(event.id);
            onOpenChange(false);
        } catch (error) {
            logError('Failed to delete event:', error);
            setIsDeletePending(false);
        } finally {
            setLoading(false);
        }
    };

    const handleRSVPChange = async (status: 'yes' | 'no' | 'maybe') => {
        if (!onRSVPChange) return;

        setLoading(true);
        try {
            await onRSVPChange(event.id, status);
            setRsvpStatus(status);
        } catch (error) {
            logError('Failed to update RSVP:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Meeting Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4 overflow-y-auto pr-2 flex-1">
                    {/* Event Title & Type */}
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-semibold text-content break-words">
                                {event.title}
                            </h3>
                            <div className={cx(
                                "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex-shrink-0",
                                getEventColorClasses(event.color, 'default')
                            )}>
                                {event.type || 'Meeting'}
                            </div>
                        </div>
                    </div>

                    {/* Google Meet Button */}
                    {event.meetingUrl && (
                        <MeetingButton meetingUrl={event.meetingUrl} />
                    )}

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg border border-border-border">
                        <div>
                            <h4 className="text-xs font-medium text-content-muted mb-2">Mulai</h4>
                            <p className="text-sm font-semibold text-content">
                                {format(event.start, 'dd MMM yyyy')}
                            </p>
                            <p className="text-sm text-content-muted mt-0.5">
                                {format(event.start, 'HH:mm')}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xs font-medium text-content-muted mb-2">Selesai</h4>
                            <p className="text-sm font-semibold text-content">
                                {format(event.end, 'dd MMM yyyy')}
                            </p>
                            <p className="text-sm text-content-muted mt-0.5">
                                {format(event.end, 'HH:mm')}
                            </p>
                        </div>
                    </div>

                    {/* Guest List */}
                    {event.guests && event.guests.length > 0 && (
                        <div className="border-t border-border-border pt-4">
                            <GuestList guests={event.guests} />
                        </div>
                    )}

                    {/* Location */}
                    {event.location && (
                        <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <RiMapPinLine className="w-5 h-5 text-content-muted flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-content mb-1">Lokasi</h4>
                                <p className="text-sm text-content-muted break-words">{event.location}</p>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="space-y-2 border-t border-border-border pt-4">
                            <h4 className="text-sm font-semibold text-content">Deskripsi</h4>
                            <p className="text-sm text-content-muted whitespace-pre-wrap leading-relaxed break-words">
                                {event.description}
                            </p>
                        </div>
                    )}

                    {/* Calendar Info */}
                    <div className="flex items-center gap-2 text-xs text-content-muted border-t border-border-border pt-4">
                        <RiCalendarLine className="w-4 h-4" />
                        <span>{event.organizer || 'Kretya Studio'}</span>
                    </div>

                    {/* RSVP */}
                    {onRSVPChange && (
                        <div className="border-t border-border-border pt-4">
                            <RSVPButtons
                                value={rsvpStatus}
                                onChange={handleRSVPChange}
                                disabled={loading}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border-border mt-auto">
                    <div className="flex-1 flex gap-2">
                        {onDelete && (
                            <>
                                {isDeletePending ? (
                                    <div className="flex items-center gap-2 animate-fadeIn w-full">
                                        <span className="text-sm font-medium text-danger whitespace-nowrap">Yakin hapus?</span>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            onClick={handleConfirmDelete}
                                            disabled={loading}
                                            className="bg-danger hover:bg-danger-hover border-transparent text-danger-fg ring-0"
                                        >
                                            Ya, Hapus
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleCancelDelete}
                                            disabled={loading}
                                        >
                                            Batal
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleDeleteClick}
                                            disabled={loading}
                                            className="hover:text-danger hover:border-danger hover:bg-danger-subtle transition-colors"
                                        >
                                            <RiDeleteBinLine className="w-4 h-4 mr-2" />
                                            Hapus
                                        </Button>
                                        <CopyEventButton event={event} />
                                    </>
                                )}
                            </>
                        )}
                        {/* Show Copy button if onDelete is missing */}
                        {!onDelete && (
                            <CopyEventButton event={event} />
                        )}
                    </div>

                    {!isDeletePending && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            <RiCloseLine className="w-4 h-4 mr-2" />
                            Tutup
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
