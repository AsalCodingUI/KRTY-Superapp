import { Database } from "@/shared/types/database.types"

export type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']
export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'WFH'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveRequestWithProfile extends LeaveRequest {
    profiles?: {
        full_name: string | null
        avatar_url: string | null
    } | null
}

export interface LeaveStats {
    used: number
    balance: number
    percentage: number
}

export interface LeaveFormData {
    id?: number
    leave_type: LeaveType
    reason: string
    start_date: Date | undefined
    end_date: Date | undefined
    proof_file?: File | null
    proof_url?: string
}
