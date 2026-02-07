import { LeavePage } from "@/page-slices/leave"
import { createClient } from "@/shared/api/supabase/server"
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

  const page = Number(resolvedSearchParams.page) || 1
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 🚀 PARALLEL FETCH: Profile first (needed for role check)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // --- JALUR 1: STAKEHOLDER (Admin View) ---
  if (canManageByRole(profile?.role)) {
    // 🚀 PARALLEL FETCH: Count + Requests + Profiles
    const [
      countResult,
      requestsResult,
      profilesResult,
      attendanceLogsResult,
    ] = await Promise.all([
      supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("leave_requests")
        .select(
          "id,start_date,end_date,leave_type,reason,proof_url,status,created_at,updated_at,user_id,profiles(full_name, avatar_url)",
        )
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase
        .from("profiles")
        .select("id, full_name, job_title, leave_used, leave_balance")
        .order("full_name", { ascending: true }),
      supabase
        .from("attendance_logs")
        .select("*, profiles(full_name, avatar_url, job_title)")
        .order("date", { ascending: false })
        .order("clock_in", { ascending: false }),
    ])

    return (
      <LeavePage
        role="stakeholder"
        profile={profile}
        requests={requestsResult.data || []}
        profiles={profilesResult.data || []}
        attendanceLogs={attendanceLogsResult.data || []}
        page={page}
        pageSize={pageSize}
        totalCount={countResult.count || 0}
      />
    )
  }

  // --- JALUR 2: EMPLOYEE (Karyawan View) ---
  // 🚀 PARALLEL FETCH: Count + Requests + Attendance Logs
  const [countResult, requestsResult, attendanceLogsResult] = await Promise.all([
    supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("leave_requests")
      .select(
        "id,start_date,end_date,leave_type,reason,proof_url,status,created_at,updated_at,user_id",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("attendance_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .order("clock_in", { ascending: false }),
  ])

  return (
    <LeavePage
      role="employee"
      profile={profile}
      requests={requestsResult.data || []}
      attendanceLogs={attendanceLogsResult.data || []}
      page={page}
      pageSize={pageSize}
      totalCount={countResult.count || 0}
    />
  )
}
