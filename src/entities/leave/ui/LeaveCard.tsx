"use client"

import { calculateBusinessDays } from "@/shared/lib/date";
import { Database } from "@/shared/types/database.types";
import { Badge, Card } from "@/shared/ui";
import { format } from "date-fns";

type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']

interface LeaveCardProps {
    leave: LeaveRequest
    showUserInfo?: boolean
    userFullName?: string
    onEdit?: (leave: LeaveRequest) => void
}

export function LeaveCard({ leave, showUserInfo, userFullName, onEdit }: LeaveCardProps) {
    const startDate = new Date(leave.start_date)
    const endDate = new Date(leave.end_date)
    const duration = calculateBusinessDays(startDate, endDate)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved':
                return 'success'
            case 'rejected':
                return 'error'
            case 'pending':
                return 'warning'
            default:
                return 'zinc'
        }
    }

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    {showUserInfo && userFullName && (
                        <p className="text-sm font-medium text-content mb-1">
                            {userFullName}
                        </p>
                    )}
                    <h3 className="text-base font-semibold text-content">
                        {leave.leave_type}
                    </h3>
                    <p className="text-sm text-content-subtle mt-1">
                        {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-content-placeholder mt-1">
                        {duration} business day{duration !== 1 ? 's' : ''}
                    </p>
                    {leave.reason && (
                        <p className="text-sm text-content-subtle mt-2 line-clamp-2">
                            {leave.reason}
                        </p>
                    )}
                </div>
                <Badge variant={getStatusColor(leave.status)}>
                    {leave.status}
                </Badge>
            </div>
            {onEdit && leave.status === 'pending' && (
                <button
                    onClick={() => onEdit(leave)}
                    className="mt-3 text-sm text-primary hover:underline"
                >
                    Edit Request
                </button>
            )}
        </Card>
    )
}
