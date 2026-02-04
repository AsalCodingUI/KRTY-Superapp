import { createClient } from '@/shared/api/supabase/client'
import { format } from "date-fns"

/**
 * Get local date string in YYYY-MM-DD format
 */
function getLocalDateString(): string {
    const now = new Date()
    return format(now, 'yyyy-MM-dd')
}

export async function clockIn(userId: string, status: string) {
    const supabase = createClient()

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

    const { data, error } = await supabase
        .from('attendance_logs')
        .insert(newLogData)
        .select()
        .single()

    if (error) throw error

    return data
}
