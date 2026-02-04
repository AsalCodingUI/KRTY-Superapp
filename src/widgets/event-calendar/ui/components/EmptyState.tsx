"use client";

import { Button } from '@/components/ui';
import { RiAddLine, RiCalendar2Line } from '@remixicon/react';

interface EmptyStateProps {
    onCreateEvent?: () => void;
    filtered?: boolean;
}

export function EmptyState({ onCreateEvent, filtered = false }: EmptyStateProps) {
    if (filtered) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <RiCalendar2Line className="w-8 h-8 text-content-muted" />
                </div>
                <h3 className="text-lg font-semibold text-content mb-2">
                    No events match your filters
                </h3>
                <p className="text-sm text-content-muted text-center max-w-sm mb-6">
                    Try adjusting your filters or view settings to see more events.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-20 h-20 rounded-full bg-surface-brand/10 flex items-center justify-center mb-4">
                <RiCalendar2Line className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-content mb-2">
                No events yet
            </h3>
            <p className="text-sm text-content-muted text-center max-w-sm mb-6">
                Get started by creating your first event. You can add meetings, tasks, or important dates.
            </p>
            {onCreateEvent && (
                <Button onClick={onCreateEvent}>
                    <RiAddLine className="w-4 h-4 mr-2" />
                    Create your first event
                </Button>
            )}
        </div>
    );
}
