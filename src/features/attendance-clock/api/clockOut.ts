import { createClient } from '@/shared/api/supabase/client'

export async function clockOut(logId: string) {
    const supabase = createClient()
    const now = new Date().toISOString()

    const { error } = await supabase
        .from('attendance_logs')
        .update({ clock_out: now, is_break: false })
        .eq('id', logId)

    if (error) throw error
}
