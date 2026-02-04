"use client"

import { isWithinInterval, parseISO, startOfDay } from "date-fns"
import { useMemo } from "react"
import { LeaveRequest, LeaveRequestWithProfile } from "./types"

interface LeaveAdminStats {
  pendingCount: number
  onLeaveToday: number
  approvedCount: number
}

export function useLeaveAdminStats(
  requests: LeaveRequestWithProfile[],
): LeaveAdminStats {
  return useMemo(() => {
    const today = startOfDay(new Date())

    // Count pending requests
    const pendingCount = requests.filter((r) => r.status === "pending").length

    // Count employees on leave today
    const onLeaveToday = requests.filter((r) => {
      if (r.status !== "approved") return false
      const start = parseISO(r.start_date)
      const end = parseISO(r.end_date)
      return isWithinInterval(today, { start, end })
    }).length

    // Count total approved requests
    const approvedCount = requests.filter((r) => r.status === "approved").length

    return {
      pendingCount,
      onLeaveToday,
      approvedCount,
    }
  }, [requests])
}

export function useLeaveFilters(requests: LeaveRequest[]) {
  return useMemo(() => {
    const statuses = Array.from(new Set(requests.map((r) => r.status)))
    const types = Array.from(new Set(requests.map((r) => r.leave_type)))

    return {
      statuses,
      types,
    }
  }, [requests])
}
