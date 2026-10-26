import { createClient } from "@/shared/api/supabase/server"
import type { DailyAttendanceStats } from "../model/types"

export async function getDailyStats(
  date: string,
): Promise<DailyAttendanceStats> {
  const supabase = await createClient()

  const [totalEmployeesResult, attendanceResult, onLeaveResult] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),

      supabase
        .from("attendance_logs")
        .select("user_id, status")
        .eq("date", date),

      supabase
        .from("leave_requests")
        .select("user_id")
        .eq("status", "approved")
        .lte("start_date", date)
        .gte("end_date", date),
    ])

  const totalEmployees = totalEmployeesResult.count || 0
  const attendanceLogs = (attendanceResult.data || []) as Array<{
    user_id: string
    status: string | null
  }>

  // Logs are "Present" (or "Cuti Masuk": clocked in while on leave), so
  // anyone with a log today is present; one person can have several logs.
  const presentIds = new Set(attendanceLogs.map((log) => log.user_id))
  const lateIds = new Set(
    attendanceLogs.filter((log) => log.status === "Late").map((l) => l.user_id),
  )
  const totalPresent = presentIds.size
  const late = lateIds.size
  const onTime = totalPresent - late
  // On leave and not clocked in anyway.
  const onLeaveCount = new Set(
    ((onLeaveResult.data || []) as Array<{ user_id: string }>)
      .map((l) => l.user_id)
      .filter((id) => !presentIds.has(id)),
  ).size

  const absent = Math.max(0, totalEmployees - totalPresent - onLeaveCount)

  const attendanceRate =
    totalEmployees > 0 ? (totalPresent / totalEmployees) * 100 : 0

  return {
    totalEmployees,
    present: totalPresent,
    onTime,
    late,
    onLeave: onLeaveCount,
    absent,
    attendanceRate,
  }
}
