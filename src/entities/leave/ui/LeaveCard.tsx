"use client"

import { calculateBusinessDays } from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { format } from "date-fns"

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

interface LeaveCardProps {
  leave: LeaveRequest
  showUserInfo?: boolean
  userFullName?: string
  onEdit?: (leave: LeaveRequest) => void
}

export function LeaveCard({
  leave,
  showUserInfo,
  userFullName,
  onEdit,
}: LeaveCardProps) {
  const startDate = new Date(leave.start_date)
  const endDate = new Date(leave.end_date)
  const duration = calculateBusinessDays(startDate, endDate)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success" as const
      case "rejected":
        return "destructive" as const
      case "pending":
        return "warning" as const
      default:
        return "secondary" as const
    }
  }

  return (
    <Card className="gap-0 p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {showUserInfo && userFullName && (
            <p className="text-foreground mb-1 text-sm font-medium">
              {userFullName}
            </p>
          )}
          <h3 className="text-foreground text-base font-semibold">
            {leave.leave_type}
          </h3>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {format(startDate, "MMM dd, yyyy")} -{" "}
            {format(endDate, "MMM dd, yyyy")}
          </p>
          <p className="text-muted-foreground/60 mt-1 text-xs">
            {duration} business day{duration !== 1 ? "s" : ""}
          </p>
          {leave.reason && (
            <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
              {leave.reason}
            </p>
          )}
        </div>
        <Badge variant={getStatusColor(leave.status)}>{leave.status}</Badge>
      </div>
      {onEdit && leave.status === "pending" && (
        <Button variant="ghost" onClick={() => onEdit(leave)} className="mt-3">
          Edit Request
        </Button>
      )}
    </Card>
  )
}
