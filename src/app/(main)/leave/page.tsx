import { LeavePage } from "@/page-slices/leave"
import { createClient } from "@/shared/api/supabase/server"

export const dynamic = "force-dynamic"
import { calculateBusinessDays } from "@/shared/lib/date"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"

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

  const effectiveUserId = await resolveEffectiveUserId(supabase, user.id)

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
  const attendanceStartDate = attendanceStart.toISOString().split("T")[0]
  const now = new Date()
  const today = now.toISOString().split("T")[0]
  const yearStart = new Date(now.getFullYear(), 0, 1)
    .toISOString()
    .split("T")[0]
  const yearEnd = new Date(now.getFullYear(), 11, 31)
    .toISOString()
    .split("T")[0]

  // 🚀 PARALLEL FETCH: Profile first (needed for role check)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", effectiveUserId)
    .single()

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
      presentTodayCountResult,
      currentlyActiveCountResult,
    ] = await Promise.all([
      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("leave_requests")
        .select(
          "id,start_date,end_date,leave_type,reason,proof_url,status,created_at,updated_at,user_id,profiles(full_name, avatar_url)",
        )
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, job_title, leave_used, leave_balance")
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
      supabase
        .from("attendance_logs")
        .select("id", { count: "exact", head: true })
        .eq("date", today),
      supabase
        .from("attendance_logs")
        .select("id", { count: "exact", head: true })
        .eq("date", today)
        .is("clock_out", null),
    ])

    const annualUsedByUser = new Map<string, number>()
    for (const req of approvedAnnualResult.data || []) {
      const days = Math.max(
        0,
        calculateBusinessDays(new Date(req.start_date), new Date(req.end_date)),
      )
      annualUsedByUser.set(
        req.user_id,
        (annualUsedByUser.get(req.user_id) || 0) + days,
      )
    }

    const hydratedProfiles = (profilesResult.data || []).map((p: {
      id: string
      full_name: string | null
      avatar_url: string | null
      job_title: string | null
      leave_used: number | null
      leave_balance: number | null
    }) => {
      const totalQuota = Math.max(
        0,
        (p.leave_used ?? 0) + (p.leave_balance ?? 12),
      )
      const used = annualUsedByUser.get(p.id) || 0
      const remaining = Math.max(0, totalQuota - used)
      return {
        ...p,
        leave_used: used,
        leave_balance: remaining,
      }
    })

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
          presentToday: presentTodayCountResult.count || 0,
          currentlyActive: currentlyActiveCountResult.count || 0,
        }}
      />
    )
  }

  // --- JALUR 2: EMPLOYEE (Karyawan View) ---
  // 🚀 PARALLEL FETCH: Count + Requests + Attendance Logs
  const [countResult, requestsResult, attendanceLogsResult, statsRequestsResult] = await Promise.all([
    supabase
      .from("leave_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", effectiveUserId),
    supabase
      .from("leave_requests")
      .select(
        "id,start_date,end_date,leave_type,reason,proof_url,status,created_at,updated_at,user_id",
      )
      .eq("user_id", effectiveUserId)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("attendance_logs")
      .select(
        "id,user_id,date,clock_in,clock_out,is_break,break_total,break_start,status,notes",
      )
      .eq("user_id", effectiveUserId)
      .gte("date", attendanceStartDate)
      .order("date", { ascending: false })
      .order("clock_in", { ascending: false })
      .range(attendanceFrom, attendanceTo),
    supabase
      .from("leave_requests")
      .select(
        "id,start_date,end_date,leave_type,reason,proof_url,status,created_at,updated_at,user_id",
      )
      .eq("user_id", effectiveUserId),
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
