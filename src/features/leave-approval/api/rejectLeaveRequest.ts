import { createClient } from '@/shared/api/supabase/client'

export async function rejectLeaveRequest(requestId: number) {
    const supabase = createClient()

    const { error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId)

    if (error) throw error
}
