"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Database } from "@/shared/types/database.types"
import { calculateBusinessDays } from "@/shared/lib/date"
import { useMemo } from "react"

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

interface LeaveStatsProps {
  requests: LeaveRequest[] // Kita butuh data requests untuk dihitung
}

export function LeaveStats({ requests }: LeaveStatsProps) {
  const MAX_LEAVE = 12

  // HITUNG DATA SECARA REALTIME DI SINI
  const stats = useMemo(() => {
    // 1. Filter hanya yang statusnya 'approved' dan tipe 'Annual Leave'
    const approvedLeaves = requests.filter(
      (r) => r.status === "approved" && r.leave_type === "Annual Leave",
    )

    // 2. Hitung total hari yang terpakai
    const usedDays = approvedLeaves.reduce((total, req) => {
      const days = calculateBusinessDays(
        new Date(req.start_date),
        new Date(req.end_date),
      )
      return total + days
    }, 0)

    return {
      used: usedDays,
      balance: MAX_LEAVE - usedDays,
    }
  }, [requests])

  // Hitung persentase bar
  // Math.min(100, ...) biar gak lebih dari 100% kalau ada error data
  const percentage = Math.min(100, Math.round((stats.used / MAX_LEAVE) * 100))

  return (
    <div className="relative w-full">
      <Card className="gap-0 p-4">
        <dt className="text-label-md text-muted-foreground">
          Annual Leave Balance
        </dt>
        <dd className="text-display-xxs text-foreground mt-2">
          {stats.balance} Days
        </dd>

        <Progress value={percentage} className="mt-6" />

        <dd className="text-label-md mt-2 flex items-center justify-between">
          <span className="text-primary font-medium">{percentage}% used</span>
          <span className="text-muted-foreground">
            {stats.used} of {MAX_LEAVE} days
          </span>
        </dd>
      </Card>
    </div>
  )
}
