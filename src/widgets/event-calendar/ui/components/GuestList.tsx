"use client";

import { cx } from '@/shared/lib/utils';
import { RiCheckLine, RiCloseLine, RiTimeLine, RiUserAddLine } from '@remixicon/react';
import type { Guest } from '../types';

interface GuestListProps {
    guests: Guest[];
    onAddGuest?: () => void;
    showAddButton?: boolean;
}

export function GuestList({ guests, onAddGuest, showAddButton = false }: GuestListProps) {
    const acceptedCount = guests.filter(g => g.status === 'accepted').length;
    const pendingCount = guests.filter(g => g.status === 'pending').length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-content flex items-center gap-2">
                    <span>{guests.length} guests</span>
                    {guests.length > 0 && (
                        <span className="text-xs text-content-muted font-normal">
                            {acceptedCount} yes, {pendingCount} awaiting
                        </span>
                    )}
                </h4>
                {showAddButton && onAddGuest && (
                    <button
                        onClick={onAddGuest}
                        className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
                    >
                        <RiUserAddLine className="w-3.5 h-3.5" />
                        Add guest
                    </button>
                )}
            </div>

            <div className="space-y-2">
                {guests.map((guest, index) => (
                    <div
                        key={guest.email + index}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                        {/* Avatar */}
                        <div className={cx(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                            guest.isOrganizer
                                ? "bg-surface-brand text-primary-fg"
                                : "bg-muted text-content"
                        )}>
                            {guest.name?.[0]?.toUpperCase() || guest.email[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-content truncate">
                                    {guest.name || guest.email}
                                </p>
                                {guest.isOrganizer && (
                                    <span className="text-xs text-content-muted">Organizer</span>
                                )}
                            </div>
                            {guest.name && (
                                <p className="text-xs text-content-muted truncate">{guest.email}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div className={cx(
                            "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                            guest.status === 'accepted' && "bg-success-subtle text-success-text",
                            guest.status === 'pending' && "bg-warning-subtle text-warning-text",
                            guest.status === 'declined' && "bg-danger-subtle text-danger-text"
                        )}>
                            {guest.status === 'accepted' && <RiCheckLine className="w-3 h-3" />}
                            {guest.status === 'pending' && <RiTimeLine className="w-3 h-3" />}
                            {guest.status === 'declined' && <RiCloseLine className="w-3 h-3" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
