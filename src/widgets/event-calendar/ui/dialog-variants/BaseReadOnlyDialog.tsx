"use client";

import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { logError } from "@/shared/lib/utils/logger";
import { cx } from '@/shared/lib/utils';
import { RiCalendarLine, RiCloseLine, RiDeleteBinLine, RiFileTextLine, RiMapPinLine } from '@remixicon/react';
import { format } from 'date-fns';
import { type ReactNode, useState } from 'react';
import type { CalendarEvent } from '../types';

interface BadgeConfig {
    label: string;
    color: 'emerald' | 'rose' | 'orange' | 'violet' | 'blue' | 'amber' | 'cyan' | 'neutral';
}

interface BaseReadOnlyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: CalendarEvent;
    title: string;
    badges?: BadgeConfig[];
    showLocation?: boolean;
    customContent?: ReactNode;
    infoMessage?: string;
    onDelete?: (eventId: string) => Promise<void>;
}

export function BaseReadOnlyDialog({
    open,
    onOpenChange,
    event,
    title,
    badges = [],
    showLocation = true,
    customContent,
    infoMessage,
    onDelete,
}: BaseReadOnlyDialogProps) {
    const [loading, setLoading] = useState(false);
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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{title}</DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-8 w-8 p-0"
                        >
                            <RiCloseLine className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Badges */}
                    {badges.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {badges.map((badge, index) => (
                                <Badge key={index} color={badge.color} className="text-sm">
                                    {badge.label}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Event Title */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-content">
                            {event.title}
                        </h3>
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-content">
                            <RiCalendarLine className="h-4 w-4 text-content-muted" />
                            <span>Waktu</span>
                        </div>
                        <div className="pl-6 space-y-1">
                            {event.allDay ? (
                                <div className="text-base text-content">
                                    {format(event.start, 'EEEE, d MMMM yyyy')}
                                    {event.start.getTime() !== event.end.getTime() && (
                                        <> - {format(event.end, 'EEEE, d MMMM yyyy')}</>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 text-content">
                                        <span className="text-sm text-content-muted">Mulai:</span>
                                        <span className="text-base">
                                            {format(event.start, 'EEEE, d MMMM yyyy • HH:mm')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-content">
                                        <span className="text-sm text-content-muted">Selesai:</span>
                                        <span className="text-base">
                                            {format(event.end, 'EEEE, d MMMM yyyy • HH:mm')}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    {showLocation && event.location && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-content">
                                <RiMapPinLine className="h-4 w-4 text-content-muted" />
                                <span>Lokasi</span>
                            </div>
                            <div className="pl-6 text-base text-content">
                                {event.location}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {event.description && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-content">
                                <RiFileTextLine className="h-4 w-4 text-content-muted" />
                                <span>Deskripsi</span>
                            </div>
                            <div className={cx(
                                "pl-6 text-base text-content",
                                "p-3 rounded-md bg-muted/30 border border-border-border"
                            )}>
                                {event.description}
                            </div>
                        </div>
                    )}

                    {/* Custom Content */}
                    {customContent}

                    {/* Info Message */}
                    {infoMessage && (
                        <div className="bg-info-subtle border border-info rounded-lg p-3">
                            <p className="text-xs text-info-text">
                                ℹ️ {infoMessage}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between pt-4 border-t border-border-border">
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
                                )}
                            </>
                        )}
                    </div>
                    {!isDeletePending && (
                        <Button
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
