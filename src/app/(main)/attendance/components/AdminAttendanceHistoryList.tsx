"use client"

import { Database } from '@/shared/types/database.types'
import { createClient } from '@/shared/api/supabase/client'
import { format, isToday } from "date-fns"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { adminAttendanceColumns } from "./AdminColumns"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/shared/ui"
import { Badge } from "@/shared/ui"
import { DataTable, EmptyState } from "@/shared/ui";

// Tipe data gabungan (Join)
type AttendanceLogWithProfile = Database['public']['Tables']['attendance_logs']['Row'] & {
    profiles: { full_name: string, avatar_url: string | null, job_title: string | null } | null
}

export function AdminAttendanceHistoryList({ logs, onApproveDelete }: { logs: AttendanceLogWithProfile[], onApproveDelete?: (id: string) => void }) {
    const router = useRouter()

    // 1. Group logs by Date
    const groupedLogs = useMemo(() => {
        const groups: Record<string, AttendanceLogWithProfile[]> = {}

        logs.forEach(log => {
            const dateKey = log.date // YYYY-MM-DD
            if (!groups[dateKey]) {
                groups[dateKey] = []
            }
            groups[dateKey].push(log)
        })

        // Sort tanggal descending (Terbaru di atas)
        return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    }, [logs])

    if (logs.length === 0) {
        return (
            <EmptyState
                title="No attendance records"
                description="Employee attendance records will appear here once they start clocking in"
                icon={null}
                variant="compact"
            />
        )
    }

    return (
        <Accordion type="multiple" className="space-y-4" defaultValue={[groupedLogs[0]?.[0]]}>
            {groupedLogs.map(([date, dailyLogs]) => {
                const dateObj = new Date(date)
                const isCurrentDay = isToday(dateObj)

                // Hitung statistik harian sederhana
                const activeSessions = dailyLogs.filter(l => !l.clock_out).length
                const totalPresent = dailyLogs.length

                return (
                    <AccordionItem key={date} value={date}>
                        <AccordionTrigger>
                            <div className="flex w-full items-center justify-between pr-4">
                                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:gap-3">
                                    <span
                                        className="font-semibold text-content dark:text-content"
                                        suppressHydrationWarning
                                    >
                                        {format(dateObj, "eeee, dd MMMM yyyy")}
                                        {isCurrentDay && <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">(Today)</span>}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-sm text-content-subtle">
                                        <span className="hidden sm:inline">Present:</span>
                                        <span className="font-medium text-content dark:text-content">{totalPresent}</span>
                                    </div>
                                    {activeSessions > 0 && (
                                        <Badge variant="success">{activeSessions} Active</Badge>
                                    )}
                                </div>
                            </div>
                        </AccordionTrigger>

                        <AccordionContent className="!p-0 !border-0">
                            <div>
                                {/* Menggunakan DataTable standar */}
                                <DataTable
                                    data={dailyLogs}
                                    columns={adminAttendanceColumns(onApproveDelete)}
                                    showExport={false}
                                    showViewOptions={false}
                                    showPagination={false}
                                    showFilterbar={false}
                                    noBorder={true}
                                    onCreate={undefined}
                                    onDelete={async (ids) => {
                                        if (!confirm(`Delete ${ids.length} attendance record(s)?`)) return
                                        const supabase = createClient()
                                        const { error } = await supabase
                                            .from('attendance_logs')
                                            .delete()
                                            .in('id', ids as string[])
                                        if (error) {
                                            alert('Error deleting: ' + error.message)
                                        } else {
                                            router.refresh()
                                        }
                                    }}
                                    searchKey="profiles.full_name"
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}