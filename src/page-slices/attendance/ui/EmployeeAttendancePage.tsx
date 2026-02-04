"use client"

import { AttendanceHistoryList } from "@/app/(main)/attendance/components/AttendanceHistoryList"
import { AttendanceStats } from "@/app/(main)/attendance/components/AttendanceStats"
import { Button } from "@/shared/ui"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/ui"
import { createClient } from '@/shared/api/supabase/client'
import { Database } from '@/shared/types/database.types'
import { differenceInMinutes, format } from "date-fns"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

type Profile = Database['public']['Tables']['profiles']['Row']
type AttendanceLog = Database['public']['Tables']['attendance_logs']['Row']

/**
 * Get local date string in YYYY-MM-DD format
 * This correctly handles timezone - uses user's local date, not UTC
 */
function getLocalDateString(): string {
    const now = new Date()
    // Using date-fns format which respects local timezone
    return format(now, 'yyyy-MM-dd')
}

interface EmployeeAttendancePageProps {
    profile: Profile
    initialLogs: AttendanceLog[]
    isOnLeave: boolean
}

export function EmployeeAttendancePage({
    profile,
    initialLogs,
    isOnLeave
}: EmployeeAttendancePageProps) {
    const supabase = createClient()
    const router = useRouter()

    const [logs, setLogs] = useState<AttendanceLog[]>(initialLogs)
    const [loading, setLoading] = useState(false)

    // Confirmation dialog state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

    // Sync with server data when initialLogs changes
    useEffect(() => {
        setLogs(initialLogs)
    }, [initialLogs])

    // Realtime subscription - only triggers server refresh, no local state manipulation
    useEffect(() => {
        const channel = supabase
            .channel('employee-attendance')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'attendance_logs',
                filter: `user_id=eq.${profile.id}`
            }, () => {
                // Only refresh from server - let React handle the state sync via initialLogs
                router.refresh()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router, profile.id])

    // --- HANDLERS with Optimistic UI Pattern ---
    // Strategy: Update local state immediately, revert on error, no double refresh

    const handleClockIn = useCallback(async (status: string) => {
        setLoading(true)

        // Use local date to avoid timezone bug
        const localDate = getLocalDateString()
        const clockInTime = new Date().toISOString()

        const newLogData = {
            user_id: profile.id,
            date: localDate, // FIX: Local date, not UTC-split
            clock_in: clockInTime,
            status: status,
            clock_out: null,
            is_break: false,
            break_total: 0
        }

        try {
            const { data, error } = await supabase
                .from('attendance_logs')
                .insert(newLogData)
                .select()
                .single()

            if (error) throw error

            // Optimistic update - add to local state
            setLogs(prev => [data, ...prev])
            toast.success('Clock in berhasil!')

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Clock in failed"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [supabase, profile.id])

    const handleClockOut = useCallback(async (logId: string) => {
        setLoading(true)
        const now = new Date().toISOString()

        // Store old value for rollback
        const oldLogs = logs

        // Optimistic update
        setLogs(prev => prev.map(log =>
            log.id === logId ? { ...log, clock_out: now, is_break: false } : log
        ))

        try {
            const { error } = await supabase
                .from('attendance_logs')
                .update({ clock_out: now, is_break: false })
                .eq('id', logId)

            if (error) throw error
            toast.success('Clock out berhasil!')

        } catch (error: unknown) {
            // Rollback on error
            setLogs(oldLogs)
            const message = error instanceof Error ? error.message : "Clock out failed"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [supabase, logs])

    const handleToggleBreak = useCallback(async (logId: string, isBreak: boolean) => {
        setLoading(true)
        const now = new Date()
        const currentLog = logs.find(l => l.id === logId)
        if (!currentLog) {
            setLoading(false)
            return
        }

        // Store old value for rollback
        const oldLogs = logs

        try {
            if (isBreak) {
                // Ending break - calculate duration
                const breakStart = currentLog.break_start ? new Date(currentLog.break_start) : now
                const duration = differenceInMinutes(now, breakStart)
                const newTotalBreak = (currentLog.break_total || 0) + duration

                // Optimistic update
                setLogs(prev => prev.map(log =>
                    log.id === logId
                        ? { ...log, is_break: false, break_start: null, break_total: newTotalBreak }
                        : log
                ))

                const { error } = await supabase
                    .from('attendance_logs')
                    .update({
                        is_break: false,
                        break_start: null,
                        break_total: newTotalBreak
                    })
                    .eq('id', logId)

                if (error) throw error
                toast.success('Break selesai!')

            } else {
                // Starting break
                const breakStartTime = now.toISOString()

                // Optimistic update
                setLogs(prev => prev.map(log =>
                    log.id === logId
                        ? { ...log, is_break: true, break_start: breakStartTime }
                        : log
                ))

                const { error } = await supabase
                    .from('attendance_logs')
                    .update({
                        is_break: true,
                        break_start: breakStartTime
                    })
                    .eq('id', logId)

                if (error) throw error
                toast.success('Break dimulai!')
            }
        } catch (error: unknown) {
            // Rollback on error
            setLogs(oldLogs)
            const message = error instanceof Error ? error.message : "Toggle break failed"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [supabase, logs])

    // Delete request with proper confirmation dialog
    const handleRequestDelete = useCallback((logId: string) => {
        setPendingDeleteId(logId)
        setDeleteConfirmOpen(true)
    }, [])

    const confirmDelete = useCallback(async () => {
        if (!pendingDeleteId) return

        setDeleteConfirmOpen(false)
        setLoading(true)

        const oldLogs = logs

        // Optimistic update - mark as requested
        setLogs(prev => prev.map(log =>
            log.id === pendingDeleteId
                ? { ...log, notes: 'DELETE_REQUESTED' }
                : log
        ))

        try {
            const { error } = await supabase
                .from('attendance_logs')
                .update({ notes: 'DELETE_REQUESTED' })
                .eq('id', pendingDeleteId)

            if (error) throw error

            toast.success('Permintaan hapus berhasil dikirim')
        } catch (error: unknown) {
            // Rollback on error
            setLogs(oldLogs)
            const message = error instanceof Error ? error.message : "Request failed"
            toast.error(message)
        } finally {
            setLoading(false)
            setPendingDeleteId(null)
        }
    }, [pendingDeleteId, supabase, logs])

    const cancelDelete = useCallback(() => {
        setDeleteConfirmOpen(false)
        setPendingDeleteId(null)
    }, [])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-lg font-semibold text-content sm:text-xl dark:text-content">
                    Attendance
                </h1>
            </div>

            <AttendanceStats
                profile={profile}
                logs={logs}
                isOnLeave={isOnLeave}
                loading={loading}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                onToggleBreak={handleToggleBreak}
            />

            <div>
                <h3 className="text-md font-semibold text-content dark:text-content mb-4">
                    Attendance History
                </h3>
                <AttendanceHistoryList logs={logs} onRequestDelete={handleRequestDelete} />
            </div>

            {/* Confirmation Dialog - replaces confirm() */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus catatan kehadiran ini?
                            Permintaan akan direview oleh stakeholder.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="secondary" onClick={cancelDelete}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Ya, Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
