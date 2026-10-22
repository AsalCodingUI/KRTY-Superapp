import { LeavePage } from "@/page-slices/leave"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { Database } from "@/shared/types/database.types"

export const dynamic = "force-dynamic"
import {
  getAttendanceLogLocalDate,
  getLocalDateString,
} from "@/shared/lib/date"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { annualLeaveSummary } from "@/shared/lib/leave"
import { canManageByRole } from "@/shared/lib/roles"

type AttendanceLogWithProfile =
  Database["public"]["Tables"]["attendance_logs"]["Row"] & {
    profiles: {
      full_name: string | null
      avatar_url: string | null
      job_title: string | null
    } | null
  }

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default async function LeaveRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>Please login.</div>

  const effectiveUserId = await resolveEffectiveUserId(
    supabase,
    user.id,
    user.email,
  )

  const ADMIN_REQUEST_COLUMNS =
    "id,start_date,end_date,leave_type,reason,review_note,proof_url,status,created_at,updated_at,user_id,profiles(full_name, avatar_url)"
  const page = Number(resolvedSearchParams.page) || 1
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const attendancePageSize = 250
  const attendanceFrom = 0
  const attendanceTo = attendanceFrom + attendancePageSize - 1
  const attendanceWindowDays = 90
  const attendanceStart = new Date()
  attendanceStart.setDate(attendanceStart.getDate() - attendanceWindowDays)
  const attendanceStartDate = getLocalDateString(attendanceStart)
  const now = new Date()
  const today = getLocalDateString(now)
  const yearStart = getLocalDateString(new Date(now.getFullYear(), 0, 1))
  const yearEnd = getLocalDateString(new Date(now.getFullYear(), 11, 31))

  // 🚀 PARALLEL FETCH: Profile first (needed for role check)
  const profile = await resolveProfileByUserIdOrEmail<Profile>(
    supabase,
    "id, krt_id, email, full_name, avatar_url, role, job_title, team_id, created_at, updated_at, leave_balance, leave_used, manager_id, is_super_admin, join_date, employment_type",
    effectiveUserId,
    effectiveUserId === user.id ? user.email : null,
  )

  if (!profile) {
    return <div>Profile not found</div>
  }

  // --- JALUR 1: STAKEHOLDER (Admin View) ---
  if (canManageByRole(profile?.role)) {
    // 🚀 PARALLEL FETCH: Count + Requests + Profiles
    const [
      countResult,
      requestsResult,
      profilesResult,
      attendanceLogsResult,
      approvedAnnualResult,
      pendingCountResult,
      approvedCountResult,
      onLeaveTodayCountResult,
    ] = await Promise.all([
      // Every pending request (they need action), then paged history.
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .neq("status", "pending"),
      Promise.all([
        supabase
          .from("leave_requests")
          .select(ADMIN_REQUEST_COLUMNS)
          .eq("status", "pending")
          .order("start_date", { ascending: true }),
        supabase
          .from("leave_requests")
          .select(ADMIN_REQUEST_COLUMNS)
          .neq("status", "pending")
          .order("created_at", { ascending: false })
          .range(from, to),
      ]).then(([pending, history]) => ({
        data: [...(pending.data || []), ...(history.data || [])],
      })),
      supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, job_title, join_date, employment_type",
        )
        .order("full_name", { ascending: true }),
      supabase
        .from("attendance_logs")
        .select(
          "id,user_id,date,clock_in,clock_out,is_break,break_total,break_start,status,notes,profiles(full_name, avatar_url, job_title)",
        )
        .gte("date", attendanceStartDate)
        .order("date", { ascending: false })
        .order("clock_in", { ascending: false })
        .range(attendanceFrom, attendanceTo),
      supabase
        .from("leave_requests")
        .select("user_id,start_date,end_date")
        .eq("status", "approved")
        .eq("leave_type", "Annual Leave")
        .lte("start_date", yearEnd)
        .gte("end_date", yearStart),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .lte("start_date", today)
        .gte("end_date", today),
    ])

    // One balance rule for everyone (see shared/lib/leave).
    const approvedByUser = new Map<
      string,
      { start_date: string; end_date: string }[]
    >()
    for (const req of approvedAnnualResult.data || []) {
      const list = approvedByUser.get(req.user_id) ?? []
      list.push(req)
      approvedByUser.set(req.user_id, list)
    }

    const hydratedProfiles = (profilesResult.data || []).map(
      (p: {
        id: string
        full_name: string | null
        avatar_url: string | null
        job_title: string | null
        join_date: string | null
        employment_type: string
      }) => {
        const summary = annualLeaveSummary(
          approvedByUser.get(p.id) ?? [],
          new Date().getFullYear(),
          p,
        )
        return {
          ...p,
          leave_quota: summary.quota,
          leave_note: summary.note,
          leave_used: summary.used,
          leave_balance: summary.remaining,
        }
      },
    )

    const todayAttendanceLogs = (
      (attendanceLogsResult.data || []) as AttendanceLogWithProfile[]
    ).filter((log) => getAttendanceLogLocalDate(log) === today)
    const presentToday = todayAttendanceLogs.length
    const currentlyActive = todayAttendanceLogs.filter(
      (log) => !log.clock_out,
    ).length

    return (
      <LeavePage
        role="stakeholder"
        profile={profile}
        requests={requestsResult.data || []}
        profiles={hydratedProfiles}
        attendanceLogs={attendanceLogsResult.data || []}
        page={page}
        pageSize={pageSize}
        totalCount={countResult.count || 0}
        overviewStats={{
          onLeaveToday: onLeaveTodayCountResult.count || 0,
          pendingRequests: pendingCountResult.count || 0,
          totalApproved: approvedCountResult.count || 0,
          presentToday,
          currentlyActive,
        }}
      />
    )
  }

  // --- JALUR 2: EMPLOYEE (Karyawan View) ---
  // Only the employee view needs the duplicate-profile ids.
  const scopedProfileIds = Array.from(
    new Set([
      profile.id,
      ...(profile.email
        ? (
            (
              await supabase
                .from("profiles")
                .select("id")
                .eq("email", profile.email)
            ).data || []
          ).map((row: { id: string }) => row.id)
        : []),
    ]),
  )

  const adminSupabase = createAdminClient()

  // 🚀 PARALLEL FETCH: Count + Requests + Attendance Logs
  const [
    countResult,
    requestsResult,
    attendanceLogsResult,
    statsRequestsResult,
  ] = await Promise.all([
    adminSupabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .in("user_id", scopedProfileIds),
    adminSupabase
      .from("leave_requests")
      .select(
        "id,start_date,end_date,leave_type,reason,review_note,proof_url,status,created_at,updated_at,user_id",
      )
      .in("user_id", scopedProfileIds)
      .order("created_at", { ascending: false })
      .range(from, to),
    adminSupabase
      .from("attendance_logs")
      .select(
        "id,user_id,date,clock_in,clock_out,is_break,break_total,break_start,status,notes,created_at",
      )
      .in("user_id", scopedProfileIds)
      .gte("date", attendanceStartDate)
      .order("date", { ascending: false })
      .order("clock_in", { ascending: false })
      .range(attendanceFrom, attendanceTo),
    adminSupabase
      .from("leave_requests")
      .select(
        "id,start_date,end_date,leave_type,reason,review_note,proof_url,status,created_at,updated_at,user_id",
      )
      .in("user_id", scopedProfileIds),
  ])

  return (
    <LeavePage
      role="employee"
      profile={profile}
      requests={requestsResult.data || []}
      statsRequests={statsRequestsResult.data || []}
      attendanceLogs={attendanceLogsResult.data || []}
      page={page}
      pageSize={pageSize}
      totalCount={countResult.count || 0}
    />
  )
}
