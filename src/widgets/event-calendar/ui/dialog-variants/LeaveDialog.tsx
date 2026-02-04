"use client";

import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';
import { cx } from '@/shared/lib/utils';
import { RiCalendarLine, RiCloseLine, RiFileTextLine, RiUserLine } from '@remixicon/react';
import { format } from 'date-fns';
import type { CalendarEvent } from '../types';

interface LeaveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: CalendarEvent;
}

// Extract employee name and leave type from title
const parseLeaveTitle = (title: string) => {
    // Format: "Employee Name - Leave Type"
    const parts = title.split(' - ');
    return {
        employeeName: parts[0] || 'Unknown',
        leaveType: parts[1] || 'Leave',
    };
};

// Get badge color based on leave type
const getLeaveTypeColor = (leaveType: string): 'rose' | 'orange' | 'violet' | 'neutral' => {
    if (leaveType.includes('Annual')) return 'rose';
    if (leaveType.includes('Sick')) return 'orange';
    if (leaveType.includes('WFH') || leaveType.includes('Work From Home')) return 'violet';
    if (leaveType.includes('Cuti') || leaveType.includes('Leave')) return 'rose';
    return 'neutral';
};

export function LeaveDialog({ open, onOpenChange, event }: LeaveDialogProps) {
    const { employeeName, leaveType } = parseLeaveTitle(event.title);
    const badgeColor = getLeaveTypeColor(leaveType);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>Detail Cuti</DialogTitle>
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
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        <Badge color="emerald" className="text-sm">
                            Approved
                        </Badge>
                        <Badge color={badgeColor} className="text-sm">
                            {leaveType}
                        </Badge>
                    </div>

                    {/* Employee Name */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-content">
                            <RiUserLine className="h-4 w-4 text-content-muted" />
                            <span>Karyawan</span>
                        </div>
                        <div className="pl-6 text-base text-content">
                            {employeeName}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-content">
                            <RiCalendarLine className="h-4 w-4 text-content-muted" />
                            <span>Periode Cuti</span>
                        </div>
                        <div className="pl-6 space-y-1">
                            <div className="flex items-center gap-2 text-content">
                                <span className="text-sm text-content-muted">Mulai:</span>
                                <span className="text-base">
                                    {format(event.start, 'EEEE, d MMMM yyyy')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-content">
                                <span className="text-sm text-content-muted">Selesai:</span>
                                <span className="text-base">
                                    {format(event.end, 'EEEE, d MMMM yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Reason/Description */}
                    {event.description && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-content">
                                <RiFileTextLine className="h-4 w-4 text-content-muted" />
                                <span>Alasan</span>
                            </div>
                            <div className={cx(
                                "pl-6 text-base text-content",
                                "p-3 rounded-md bg-muted/30 border border-border-border"
                            )}>
                                {event.description}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t border-border-border">
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                    >
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
