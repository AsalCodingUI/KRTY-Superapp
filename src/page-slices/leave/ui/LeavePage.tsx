"use client"

import { Database } from "@/shared/types/database.types"
import { canManageByRole } from "@/shared/lib/roles"
import dynamic from "next/dynamic"

const EmployeeLeavePage = dynamic(
  () => import("./EmployeeLeavePage").then((mod) => mod.EmployeeLeavePage),
  {
    loading: () => null,
  },
)

const StakeholderLeavePage = dynamic(
  () =>
    import("./StakeholderLeavePage").then((mod) => mod.StakeholderLeavePage),
  {
    loading: () => null,
  },
)

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileSummary = Pick<
  Profile,
  "id" | "full_name" | "avatar_url" | "job_title" | "leave_used" | "leave_balance"
>
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
  statsRequests?: LeaveRequest[]
  profiles?: ProfileSummary[]
  attendanceLogs?: AttendanceLogWithProfile[]
  overviewStats?: {
    onLeaveToday: number
    pendingRequests: number
    totalApproved: number
    presentToday: number
    currentlyActive: number
  }
  page: number
  pageSize: number
  totalCount: number
}

export function LeavePage({
  role,
  profile,
  requests,
  statsRequests = [],
  profiles = [],
  attendanceLogs = [],
  overviewStats,
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
        overviewStats={overviewStats}
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
      statsRequests={statsRequests}
      attendanceLogs={attendanceLogs as AttendanceLog[]}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
    />
  )
}
