"use client"

import { Card } from "@/components/Card"
import { ProgressBar } from "@/components/ProgressBar"
import { Database } from "@/lib/database.types"
import { calculateBusinessDays } from "@/lib/dateUtils"
import { useMemo } from "react"

type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']

interface LeaveStatsProps {
    requests: LeaveRequest[] // Kita butuh data requests untuk dihitung
}

export function LeaveStats({ requests }: LeaveStatsProps) {
    const MAX_LEAVE = 12

    // HITUNG DATA SECARA REALTIME DI SINI
    const stats = useMemo(() => {
        // 1. Filter hanya yang statusnya 'approved' dan tipe 'Annual Leave'
        const approvedLeaves = requests.filter(
            (r) => r.status === 'approved' && r.leave_type === 'Annual Leave'
        )

        // 2. Hitung total hari yang terpakai
        const usedDays = approvedLeaves.reduce((total, req) => {
            const days = calculateBusinessDays(new Date(req.start_date), new Date(req.end_date))
            return total + days
        }, 0)

        return {
            used: usedDays,
            balance: MAX_LEAVE - usedDays
        }
    }, [requests])

    // Hitung persentase bar
    // Math.min(100, ...) biar gak lebih dari 100% kalau ada error data
    const percentage = Math.min(100, Math.round((stats.used / MAX_LEAVE) * 100))

    return (
        <div className="relative w-full">
            <Card>
                <dt className="text-sm font-medium text-content-subtle dark:text-content-subtle">
                    Annual Leave Balance
                </dt>
                <dd className="mt-2 text-2xl font-semibold text-content dark:text-content">
                    {stats.balance} Days
                </dd>

                <ProgressBar value={percentage} className="mt-6" />

                <dd className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-primary font-medium">
                        {percentage}% used
                    </span>
                    <span className="text-content-subtle dark:text-content-subtle">
                        {stats.used} of {MAX_LEAVE} days
                    </span>
                </dd>
            </Card>
        </div>
    )
}