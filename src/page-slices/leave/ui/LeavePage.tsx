import { Database } from "@/shared/types/database.types"
import { canManageByRole } from "@/shared/lib/roles"
import { EmployeeLeavePage } from "./EmployeeLeavePage"
import { StakeholderLeavePage } from "./StakeholderLeavePage"

// A server component: it picks the page by role and only that client page
// ships. (A client-side next/dynamic here could resolve after hydration
// started and shift the useId-based ids inside the table.)

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type ProfileSummary = Pick<
  Profile,
  "id" | "full_name" | "avatar_url" | "job_title"
> & {
  /** This year's annual leave, computed from approved requests. */
  leave_used: number
  leave_balance: number
}
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
  attendanceLogs?: AttendanceLog[] | AttendanceLogWithProfile[]
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
        attendanceLogs={attendanceLogs as AttendanceLogWithProfile[]}
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
    />
  )
}
