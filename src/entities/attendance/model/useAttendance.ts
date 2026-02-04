"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useEffect, useState } from "react"
import type { AttendanceLog } from "./types"

export function useAttendance(
  userId?: string,
  options?: { limit?: number; startDate?: string; endDate?: string },
) {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const supabase = createClient()

        let query = supabase
          .from("attendance_logs")
          .select("*")
          .order("date", { ascending: false })
          .order("clock_in", { ascending: false })

        if (userId) {
          query = query.eq("user_id", userId)
        }

        if (options?.startDate) {
          query = query.gte("date", options.startDate)
        }

        if (options?.endDate) {
          query = query.lte("date", options.endDate)
        }

        if (options?.limit) {
          query = query.limit(options.limit)
        }

        const { data, error: fetchError } = await query

        if (fetchError) {
          throw new Error(fetchError.message)
        }

        setLogs(data || [])
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch attendance"),
        )
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [userId, options?.limit, options?.startDate, options?.endDate])

  const activeSession = logs.find((log) => !log.clock_out)

  return {
    logs,
    activeSession,
    loading,
    error,
  }
}
