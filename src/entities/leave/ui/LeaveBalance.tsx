"use client"

import { calculateBusinessDays } from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useMemo } from "react"

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

interface LeaveBalanceProps {
  requests: LeaveRequest[]
  maxLeave?: number
  showDetails?: boolean
}

export function LeaveBalance({
  requests,
  maxLeave = 12,
  showDetails = true,
}: LeaveBalanceProps) {
  const stats = useMemo(() => {
    // Filter only approved Annual Leave requests
    const approvedLeaves = requests.filter(
      (r) => r.status === "approved" && r.leave_type === "Annual Leave",
    )

    // Calculate total used days
    const usedDays = approvedLeaves.reduce((total, req) => {
      const days = calculateBusinessDays(
        new Date(req.start_date),
        new Date(req.end_date),
      )
      return total + days
    }, 0)

    return {
      used: usedDays,
      balance: maxLeave - usedDays,
      percentage: Math.min(100, Math.round((usedDays / maxLeave) * 100)),
    }
  }, [requests, maxLeave])

  return (
    <Card className="gap-0 p-4">
      <dt className="text-label-md text-muted-foreground dark:text-muted-foreground">
        Annual Leave Balance
      </dt>
      <dd className="text-display-xxs text-foreground dark:text-foreground mt-2">
        {stats.balance} Days
      </dd>

      {showDetails && (
        <>
          <Progress value={stats.percentage} className="mt-6" />

          <dd className="text-label-md mt-2 flex items-center justify-between">
            <span className="text-primary font-medium">
              {stats.percentage}% used
            </span>
            <span className="text-muted-foreground dark:text-muted-foreground">
              {stats.used} of {maxLeave} days
            </span>
          </dd>
        </>
      )}
    </Card>
  )
}
