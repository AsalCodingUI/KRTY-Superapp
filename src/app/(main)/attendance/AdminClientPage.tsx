"use client"

import { Card } from "@/components/Card"
import { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminAttendanceHistoryList } from "./components/AdminAttendanceHistoryList"

// Join Profile
type AttendanceLogWithProfile = Database['public']['Tables']['attendance_logs']['Row'] & {
    profiles: { full_name: string, avatar_url: string | null, job_title: string | null } | null
}

export default function AttendanceAdminPage({ logs }: { logs: AttendanceLogWithProfile[] }) {

    // HAPUS BARIS INI (todayStr):
    // const todayStr = format(new Date(), "dd MMMM yyyy")

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const channel = supabase
            .channel('admin-attendance-list')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'attendance_logs' },
                () => router.refresh()
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [supabase, router])

    // Hitung statistik Ringkas untuk Hari Ini
    const todayDateKey = new Date().toISOString().split('T')[0]
    const todaysLogs = logs.filter(l => l.date === todayDateKey)

    const handleApproveDelete = async (logId: string) => {
        if (!confirm('Approve delete request for this attendance record?')) return

        const { error } = await supabase
            .from('attendance_logs')
            .delete()
            .eq('id', logId)

        if (error) {
            alert('Error deleting: ' + error.message)
        } else {
            router.refresh()
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-content sm:text-xl dark:text-content">
                        Attendance Overview
                    </h1>
                </div>
            </div>

            {/* Summary Cards (Fokus Hari Ini) */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 mb-6">
                <Card>
                    <dt className="text-sm font-medium text-content-subtle dark:text-content-subtle">Present Today</dt>
                    <dd className="mt-2 text-2xl font-semibold text-content dark:text-content">
                        {todaysLogs.length}
                    </dd>
                </Card>
                <Card>
                    <dt className="text-sm font-medium text-content-subtle dark:text-content-subtle">Currently Active</dt>
                    <dd className="mt-2 text-2xl font-semibold text-content dark:text-content">
                        {todaysLogs.filter(l => !l.clock_out).length}
                    </dd>
                </Card>
            </div>

            {/* Accordion List */}
            <div className="space-y-4">
                <h3 className="text-md font-semibold text-content dark:text-content">
                    Attendance History
                </h3>
                <AdminAttendanceHistoryList logs={logs} onApproveDelete={handleApproveDelete} />
            </div>
        </div>
    )
}