import { createClient } from "@/shared/api/supabase/server"
import { LeaveRequest, LeaveRequestWithProfile } from "../model/types"

interface GetLeaveRequestsOptions {
    userId?: string
    status?: 'pending' | 'approved' | 'rejected'
    includeProfile?: boolean
    page?: number
    pageSize?: number
}

interface GetLeaveRequestsResult {
    data: LeaveRequest[] | LeaveRequestWithProfile[]
    count: number
    error: Error | null
}

export async function getLeaveRequests(
    options: GetLeaveRequestsOptions = {}
): Promise<GetLeaveRequestsResult> {
    const {
        userId,
        status,
        includeProfile = false,
        page = 1,
        pageSize = 20
    } = options

    const supabase = await createClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    try {
        if (includeProfile) {
            let query = supabase
                .from('leave_requests')
                .select('*, profiles(full_name, avatar_url)', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to)

            if (userId) {
                query = query.eq('user_id', userId)
            }

            if (status) {
                query = query.eq('status', status)
            }

            const { data, count, error } = await query

            if (error) {
                throw error
            }

            return {
                data: (data || []) as LeaveRequestWithProfile[],
                count: count || 0,
                error: null
            }
        } else {
            let query = supabase
                .from('leave_requests')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to)

            if (userId) {
                query = query.eq('user_id', userId)
            }

            if (status) {
                query = query.eq('status', status)
            }

            const { data, count, error } = await query

            if (error) {
                throw error
            }

            return {
                data: data || [],
                count: count || 0,
                error: null
            }
        }
    } catch (error) {
        return {
            data: [],
            count: 0,
            error: error instanceof Error ? error : new Error('Failed to fetch leave requests')
        }
    }
}

export async function getLeaveRequestById(id: number): Promise<LeaveRequest | null> {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('leave_requests')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            throw error
        }

        return data
    } catch (error) {
        console.error('Failed to fetch leave request:', error)
        return null
    }
}
