import type { Database } from "@/shared/types"

export type AttendanceLog =
  Database["public"]["Tables"]["attendance_logs"]["Row"]

export interface AttendanceSession {
  id: string
  user_id: string
  date: string
  clock_in: string
  clock_out: string | null
  break_total: number | null
  break_start: string | null
  is_break: boolean | null
  status: string | null
  created_at: string
}

export interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  totalHours: number
}

export interface DailyAttendanceStats {
  totalEmployees: number
  present: number
  onTime: number
  late: number
  onLeave: number
  absent: number
  attendanceRate: number
}
