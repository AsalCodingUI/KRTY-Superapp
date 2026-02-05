"use client"

import { Database } from "@/shared/types/database.types"
import { EmployeeAttendancePage } from "./EmployeeAttendancePage"
import { StakeholderAttendancePage } from "./StakeholderAttendancePage"
import { canManageByRole } from "@/shared/lib/roles"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

type AttendanceLogWithProfile = AttendanceLog & {
  profiles: {
    full_name: string
    avatar_url: string | null
    job_title: string | null
  } | null
}

interface AttendancePageProps {
  role: "employee" | "stakeholder"
  profile: Profile
  logs: AttendanceLog[] | AttendanceLogWithProfile[]
  isOnLeave?: boolean
}

export function AttendancePage({
  role,
  profile,
  logs,
  isOnLeave = false,
}: AttendancePageProps) {
  if (canManageByRole(role)) {
    return (
      <StakeholderAttendancePage logs={logs as AttendanceLogWithProfile[]} />
    )
  }

  return (
    <EmployeeAttendancePage
      profile={profile}
      initialLogs={logs as AttendanceLog[]}
      isOnLeave={isOnLeave}
    />
  )
}
