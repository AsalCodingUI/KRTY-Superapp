import { createClient } from "@/shared/api/supabase/server"
import type { DailyAttendanceStats } from "../model/types"

export async function getDailyStats(
  date: string,
): Promise<DailyAttendanceStats> {
  const supabase = await createClient()

  const [totalEmployeesResult, attendanceResult, onLeaveResult] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),

      supabase.from("attendance_logs").select("id, status").eq("date", date),

      supabase
        .from("leave_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .lte("start_date", date)
        .gte("end_date", date),
    ])

  const totalEmployees = totalEmployeesResult.count || 0
  const attendanceLogs = attendanceResult.data || []
  const onLeaveCount = onLeaveResult.count || 0

  const onTime = attendanceLogs.filter(
    (log: { status: string | null }) => !log.status || log.status === "On Time",
  ).length
  const late = attendanceLogs.filter((log: { status: string | null }) => log.status === "Late").length
  const totalPresent = onTime + late

  const absent = Math.max(0, totalEmployees - totalPresent - onLeaveCount)

  const attendanceRate =
    totalEmployees > 0
      ? ((totalPresent + onLeaveCount) / totalEmployees) * 100
      : 0

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
