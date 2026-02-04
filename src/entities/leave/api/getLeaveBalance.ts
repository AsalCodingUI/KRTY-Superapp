import { createClient } from "@/shared/api/supabase/server"
import { calculateBusinessDays } from "@/shared/lib/date"

interface LeaveBalanceResult {
  used: number
  balance: number
  maxLeave: number
  error: Error | null
}

export async function getLeaveBalance(
  userId: string,
  maxLeave: number = 12,
): Promise<LeaveBalanceResult> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "approved")
      .eq("leave_type", "Annual Leave")

    if (error) {
      throw error
    }

    const usedDays = (data || []).reduce((total, req) => {
      const days = calculateBusinessDays(
        new Date(req.start_date),
        new Date(req.end_date),
      )
      return total + days
    }, 0)

    return {
      used: usedDays,
      balance: maxLeave - usedDays,
      maxLeave,
      error: null,
    }
  } catch (error) {
    return {
      used: 0,
      balance: maxLeave,
      maxLeave,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to fetch leave balance"),
    }
  }
}
