import { createClient } from "@/shared/api/supabase/server"
import type { LeaveRequestWithProfile } from "../model/types"

export interface LeaveDashboardStats {
  pendingLeaves: LeaveRequestWithProfile[]
  recentLeaves: LeaveRequestWithProfile[]
  pendingCount: number
}

export async function getLeaveDashboardStats(): Promise<LeaveDashboardStats> {
  const supabase = await createClient()

  const [pendingLeavesResult, recentLeavesResult] = await Promise.all([
    // Pending leave approvals (limit 20)
    supabase
      .from("leave_requests")
      .select(
        `
                *,
                profiles (
                    full_name,
                    avatar_url
                )
            `,
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20),

    // Recent leave requests (last 10)
    supabase
      .from("leave_requests")
      .select(
        `
                *,
                profiles (
                    full_name,
                    avatar_url
                )
            `,
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  return {
    pendingLeaves: (pendingLeavesResult.data ||
      []) as LeaveRequestWithProfile[],
    recentLeaves: (recentLeavesResult.data || []) as LeaveRequestWithProfile[],
    pendingCount: pendingLeavesResult.data?.length || 0,
  }
}
