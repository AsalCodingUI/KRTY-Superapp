"use client"

import { Database } from '@/shared/types/database.types'
import { EmployeeLeavePage } from './EmployeeLeavePage'
import { StakeholderLeavePage } from './StakeholderLeavePage'

type Profile = Database['public']['Tables']['profiles']['Row']
type LeaveRequest = Database['public']['Tables']['leave_requests']['Row']

type LeaveRequestWithProfile = LeaveRequest & {
    profiles: { full_name: string, avatar_url: string | null } | null
}

interface LeavePageProps {
    role: "employee" | "stakeholder"
    profile: Profile
    requests: LeaveRequest[] | LeaveRequestWithProfile[]
    profiles?: Profile[]
    page: number
    pageSize: number
    totalCount: number
}

export function LeavePage({
    role,
    profile,
    requests,
    profiles = [],
    page,
    pageSize,
    totalCount
}: LeavePageProps) {
    if (role === "stakeholder") {
        return (
            <StakeholderLeavePage
                requests={requests as LeaveRequestWithProfile[]}
                profiles={profiles}
                page={page}
                pageSize={pageSize}
                totalCount={totalCount}
            />
        )
    }

    return (
        <EmployeeLeavePage
            profile={profile}
            requests={requests as LeaveRequest[]}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
        />
    )
}
