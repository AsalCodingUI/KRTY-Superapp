import { createClient } from '@/shared/api/supabase/client'
import { Database } from '@/shared/types/database.types'
import { differenceInMinutes } from "date-fns"

type AttendanceLog = Database['public']['Tables']['attendance_logs']['Row']

export async function toggleBreak(log: AttendanceLog, isBreak: boolean) {
    const supabase = createClient()
    const now = new Date()

    if (isBreak) {
        // Ending break - calculate duration
        const breakStart = log.break_start ? new Date(log.break_start) : now
        const duration = differenceInMinutes(now, breakStart)
        const newTotalBreak = (log.break_total || 0) + duration

        const { error } = await supabase
            .from('attendance_logs')
            .update({
                is_break: false,
                break_start: null,
                break_total: newTotalBreak
            })
            .eq('id', log.id)

        if (error) throw error

        return { break_total: newTotalBreak }
    } else {
        // Starting break
        const breakStartTime = now.toISOString()

        const { error } = await supabase
            .from('attendance_logs')
            .update({
                is_break: true,
                break_start: breakStartTime
            })
            .eq('id', log.id)

        if (error) throw error

        return { break_start: breakStartTime }
    }
}
