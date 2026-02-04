"use client"

import { calculateBusinessDays } from "@/shared/lib/date"
import { useMemo } from "react"
import { LeaveRequest, LeaveStats } from "./types"

interface UseLeaveBalanceOptions {
    maxLeave?: number
}

export function useLeaveBalance(
    requests: LeaveRequest[],
    options: UseLeaveBalanceOptions = {}
): LeaveStats {
    const { maxLeave = 12 } = options

    return useMemo(() => {
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
}
