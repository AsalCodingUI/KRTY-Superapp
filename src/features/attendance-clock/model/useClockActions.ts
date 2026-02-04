import { createClient } from '@/shared/api/supabase/client'
import { Database } from '@/shared/types/database.types'
import { differenceInMinutes, format } from "date-fns"
import { useCallback, useState } from "react"
import { toast } from "sonner"

type AttendanceLog = Database['public']['Tables']['attendance_logs']['Row']

/**
 * Get local date string in YYYY-MM-DD format
 * This correctly handles timezone - uses user's local date, not UTC
 */
function getLocalDateString(): string {
    const now = new Date()
    return format(now, 'yyyy-MM-dd')
}

interface UseClockActionsProps {
    userId: string
    logs: AttendanceLog[]
    onLogsUpdate: (logs: AttendanceLog[]) => void
}

export function useClockActions({ userId, logs, onLogsUpdate }: UseClockActionsProps) {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    const handleClockIn = useCallback(async (status: string) => {
        setLoading(true)

        const localDate = getLocalDateString()
        const clockInTime = new Date().toISOString()

        const newLogData = {
            user_id: userId,
            date: localDate,
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

            // Optimistic update
            onLogsUpdate([data, ...logs])
            toast.success('Clock in berhasil!')

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Clock in failed"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [supabase, userId, logs, onLogsUpdate])

    const handleClockOut = useCallback(async (logId: string) => {
        setLoading(true)
        const now = new Date().toISOString()

        const oldLogs = logs

        // Optimistic update
        onLogsUpdate(logs.map(log =>
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
            onLogsUpdate(oldLogs)
            const message = error instanceof Error ? error.message : "Clock out failed"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [supabase, logs, onLogsUpdate])

    const handleToggleBreak = useCallback(async (logId: string, isBreak: boolean) => {
        setLoading(true)
        const now = new Date()
        const currentLog = logs.find(l => l.id === logId)
        if (!currentLog) {
            setLoading(false)
            return
        }

        const oldLogs = logs

        try {
            if (isBreak) {
                // Ending break - calculate duration
                const breakStart = currentLog.break_start ? new Date(currentLog.break_start) : now
                const duration = differenceInMinutes(now, breakStart)
                const newTotalBreak = (currentLog.break_total || 0) + duration

                // Optimistic update
                onLogsUpdate(logs.map(log =>
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
                onLogsUpdate(logs.map(log =>
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
            onLogsUpdate(oldLogs)
            const message = error instanceof Error ? error.message : "Toggle break failed"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }, [supabase, logs, onLogsUpdate])

    return {
        loading,
        handleClockIn,
        handleClockOut,
        handleToggleBreak
    }
}
