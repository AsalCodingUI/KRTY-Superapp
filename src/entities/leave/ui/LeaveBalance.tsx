"use client"

import { calculateBusinessDays } from "@/shared/lib/date";
import { Database } from "@/shared/types/database.types";
import { Card, ProgressBar } from "@/shared/ui";
import { useMemo } from "react";

type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']

interface LeaveBalanceProps {
    requests: LeaveRequest[]
    maxLeave?: number
    showDetails?: boolean
}

export function LeaveBalance({ requests, maxLeave = 12, showDetails = true }: LeaveBalanceProps) {
    const stats = useMemo(() => {
        // Filter only approved Annual Leave requests
        const approvedLeaves = requests.filter(
            (r) => r.status === 'approved' && r.leave_type === 'Annual Leave'
        )

        // Calculate total used days
        const usedDays = approvedLeaves.reduce((total, req) => {
            const days = calculateBusinessDays(new Date(req.start_date), new Date(req.end_date))
            return total + days
        }, 0)

        return {
            used: usedDays,
            balance: maxLeave - usedDays,
            percentage: Math.min(100, Math.round((usedDays / maxLeave) * 100))
        }
    }, [requests, maxLeave])

    return (
        <Card>
            <dt className="text-sm font-medium text-content-subtle dark:text-content-subtle">
                Annual Leave Balance
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-content dark:text-content">
                {stats.balance} Days
            </dd>

            {showDetails && (
                <>
                    <ProgressBar value={stats.percentage} className="mt-6" />

                    <dd className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-primary font-medium">
                            {stats.percentage}% used
                        </span>
                        <span className="text-content-subtle dark:text-content-subtle">
                            {stats.used} of {maxLeave} days
                        </span>
                    </dd>
                </>
            )}
        </Card>
    )
}
