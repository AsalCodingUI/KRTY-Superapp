"use client"

import {
  RiCalendarCheckLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiTimeLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import Link from "next/link"
import { Badge, Card } from "@/shared/ui"
import { StatsCard } from "@/shared/ui"

interface AttendanceLog {
  id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  status: string | null
}

interface LeaveRequest {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  status: string
  days_requested: number
}

interface EmployeeAttendanceWidgetProps {
  leaveBalance: number
  recentAttendance: AttendanceLog[]
  recentLeaveRequests: LeaveRequest[]
}

export function EmployeeAttendanceWidget({
  leaveBalance,
  recentAttendance,
  recentLeaveRequests,
}: EmployeeAttendanceWidgetProps) {
  const onTimeCount = recentAttendance.filter(
    (log) => !log.status || log.status === "On Time",
  ).length
  const lateCount = recentAttendance.filter(
    (log) => log.status === "Late",
  ).length
  const attendanceRate =
    recentAttendance.length > 0
      ? Math.round((onTimeCount / recentAttendance.length) * 100)
      : 100

  const pendingLeave = recentLeaveRequests.find(
    (req) => req.status === "pending",
  )
  const approvedLeave = recentLeaveRequests.filter(
    (req) => req.status === "approved",
  )

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Leave Balance Card */}
      <Link href="/leave">
        <StatsCard
          title="Leave Balance"
          value={`${leaveBalance} days`}
          icon={<RiCalendarLine className="size-5" />}
          className="transition-all hover:shadow-md"
        />
      </Link>

      {/* Attendance Rate Card */}
      <Link href="/leave">
        <StatsCard
          title="Attendance (Last 7 Days)"
          value={`${attendanceRate}%`}
          icon={<RiCheckboxCircleLine className="size-5" />}
          className="transition-all hover:shadow-md"
        />
      </Link>

      {/* Recent Leave Status */}
      <Card className="lg:col-span-2">
        <h3 className="text-heading-md text-foreground-primary mb-4">
          Leave Status
        </h3>

        {pendingLeave && (
          <div className="border-warning/20 bg-warning/5 mb-4 rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <RiTimeLine className="text-warning size-4" />
              <span className="text-label-md text-foreground-primary">
                Pending Approval
              </span>
            </div>
            <div className="text-label-md text-foreground-secondary">
              <span className="font-medium">{pendingLeave.leave_type}</span>
              {" • "}
              {format(new Date(pendingLeave.start_date), "MMM d")} -{" "}
              {format(new Date(pendingLeave.end_date), "MMM d, yyyy")}
              {" • "}
              {pendingLeave.days_requested} days
            </div>
          </div>
        )}

        {approvedLeave.length > 0 && (
          <div>
            <h4 className="text-label-md text-foreground-secondary mb-2">
              Recent Approved Leave
            </h4>
            <div className="space-y-2">
              {approvedLeave.slice(0, 2).map((leave) => (
                <div
                  key={leave.id}
                  className="bg-surface-neutral-secondary flex items-center justify-between rounded-lg p-2"
                >
                  <div className="flex items-center gap-2">
                    <RiCalendarCheckLine className="text-success size-4" />
                    <span className="text-body-sm text-foreground-primary">
                      {leave.leave_type}
                    </span>
                  </div>
                  <span className="text-body-xs text-foreground-secondary">
                    {format(new Date(leave.start_date), "MMM d")} -{" "}
                    {format(new Date(leave.end_date), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!pendingLeave && approvedLeave.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-body-sm text-foreground-secondary">
              No recent leave requests
            </p>
            <Link href="/leave">
              <Badge variant="info" className="mt-2">
                Request Leave
              </Badge>
            </Link>
          </div>
        )}

        {/* Recent Attendance Summary */}
        <div className="border-neutral-primary mt-4 border-t pt-4">
          <h4 className="text-label-md text-foreground-secondary mb-3">
            Last 7 Days Attendance
          </h4>
          <div className="text-body-sm flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-success size-3 rounded-full" />
              <span className="text-foreground-secondary">
                On Time: {onTimeCount}
              </span>
            </div>
            {lateCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="bg-warning size-3 rounded-full" />
                <span className="text-foreground-secondary">
                  Late: {lateCount}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
