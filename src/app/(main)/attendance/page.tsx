import { AttendancePage } from "@/page-slices/attendance"
import { createClient } from "@/shared/api/supabase/server"
import { canManageByRole, isEmployeeRole } from "@/shared/lib/roles"
import { redirect } from "next/navigation"

// Helper untuk menambah jam
function addHours(date: Date, hours: number) {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

export default async function AttendanceRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>Please login.</div>

  const todayStr = new Date().toISOString().split("T")[0]

  // 🚀 PARALLEL FETCH: Profile + Leave Status + Last Log (all independent)
  const [profileResult, leaveResult, lastLogResult] = await Promise.all([
    // 1. Fetch Profile
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    // 2. Check Leave Status Today
    supabase
      .from("leave_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .lte("start_date", todayStr)
      .gte("end_date", todayStr)
      .maybeSingle(),
    // 3. Check Last Unclosed Log (for auto clock-out)
    supabase
      .from("attendance_logs")
      .select("id, date, clock_in")
      .eq("user_id", user.id)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  const isTodayOnLeave = !!leaveResult.data
  const lastLog = lastLogResult.data

  // --- LOGIC AUTO CLOCK-OUT (Khusus Employee) ---
  if (isEmployeeRole(profile?.role) && lastLog) {
    const logDate = new Date(lastLog.date).toISOString().split("T")[0]

    // Jika tanggal log BUKAN hari ini (berarti sesi kemarin/lusa)
    if (logDate !== todayStr) {
      const clockInTime = new Date(lastLog.clock_in)
      const autoOutTime = addHours(clockInTime, 8).toISOString()

      await supabase
        .from("attendance_logs")
        .update({
          clock_out: autoOutTime,
          status: "System Auto-out",
        })
        .eq("id", lastLog.id)
    }
  }

  // --- ROUTING POV ---
  if (canManageByRole(profile?.role)) {
    redirect("/leave")
  }

  // Fetch Data untuk Employee (History Bulan Ini)
  const { data: myLogs } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("clock_in", { ascending: false })

  return (
    <AttendancePage
      role="employee"
      profile={profile}
      logs={myLogs || []}
      isOnLeave={isTodayOnLeave}
    />
  )
}
