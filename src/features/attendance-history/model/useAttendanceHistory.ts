import { Database } from "@/shared/types/database.types"
import { useMemo } from "react"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

export function useAttendanceHistory(logs: AttendanceLog[]) {
  // Group logs by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, AttendanceLog[]> = {}

    logs.forEach((log) => {
      const dateKey = log.date
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(log)
    })

    return groups
  }, [logs])

  // Get today's logs
  const todayLogs = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    return logs.filter((log) => log.date === todayStr)
  }, [logs])

  // Get active session
  const activeSession = useMemo(() => {
    return todayLogs.find((log) => !log.clock_out) || null
  }, [todayLogs])

  return {
    groupedByDate,
    todayLogs,
    activeSession,
  }
}
