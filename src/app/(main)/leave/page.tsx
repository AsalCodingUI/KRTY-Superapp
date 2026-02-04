import { LeavePage } from "@/page-slices/leave"
import { createClient } from "@/shared/api/supabase/server"

export default async function LeaveRoute({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>Please login.</div>

  const page = Number(searchParams.page) || 1
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
  if (profile?.role === "stakeholder") {
    // 🚀 PARALLEL FETCH: Count + Requests + Profiles
    const [countResult, requestsResult, profilesResult] = await Promise.all([
      supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("leave_requests")
        .select("*, profiles(full_name, avatar_url)")
        .order("created_at", { ascending: false })
        .range(from, to),
      supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true }),
    ])

    return (
      <LeavePage
        role="stakeholder"
        profile={profile}
        requests={requestsResult.data || []}
        profiles={profilesResult.data || []}
        page={page}
        pageSize={pageSize}
        totalCount={countResult.count || 0}
      />
    )
  }

  // --- JALUR 2: EMPLOYEE (Karyawan View) ---
  // 🚀 PARALLEL FETCH: Count + Requests
  const [countResult, requestsResult] = await Promise.all([
    supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("leave_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(from, to),
  ])

  return (
    <LeavePage
      role="employee"
      profile={profile}
      requests={requestsResult.data || []}
      page={page}
      pageSize={pageSize}
      totalCount={countResult.count || 0}
    />
  )
}
