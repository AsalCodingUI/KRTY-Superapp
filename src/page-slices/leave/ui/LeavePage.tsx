"use client"

import { Database } from "@/shared/types/database.types"
import { EmployeeLeavePage } from "./EmployeeLeavePage"
import { StakeholderLeavePage } from "./StakeholderLeavePage"
import { canManageByRole } from "@/shared/lib/roles"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]
type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

type LeaveRequestWithProfile = LeaveRequest & {
  profiles: { full_name: string; avatar_url: string | null } | null
}
type AttendanceLogWithProfile = AttendanceLog & {
  profiles: {
    full_name: string
    avatar_url: string | null
    job_title: string | null
  } | null
}

interface LeavePageProps {
  role: "employee" | "stakeholder"
  profile: Profile
  requests: LeaveRequest[] | LeaveRequestWithProfile[]
  profiles?: Profile[]
  attendanceLogs?: AttendanceLogWithProfile[]
  page: number
  pageSize: number
  totalCount: number
}

export function LeavePage({
  role,
  profile,
  requests,
  profiles = [],
  attendanceLogs = [],
  page,
  pageSize,
  totalCount,
}: LeavePageProps) {
  if (canManageByRole(role)) {
    return (
      <StakeholderLeavePage
        requests={requests as LeaveRequestWithProfile[]}
        profiles={profiles}
        attendanceLogs={attendanceLogs}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        role={role}
      />
    )
  }

  return (
    <EmployeeLeavePage
      profile={profile}
      requests={requests as LeaveRequest[]}
      attendanceLogs={attendanceLogs as AttendanceLog[]}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
    />
  )
}
