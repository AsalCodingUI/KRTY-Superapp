"use client"

import { useClockActions } from "@/features/attendance-clock/model/useClockActions"
import { LeaveRequestModal } from "@/page-slices/leave/ui/components/LeaveRequestModal"
import { createClient } from "@/shared/api/supabase/client"
import { Database } from "@/shared/types/database.types"
import { Badge, Button, EmptyState } from "@/shared/ui"
import {
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

interface EmployeeAttendanceWidgetProps {
  userId: string
  userFullName?: string | null
  recentAttendance: AttendanceLog[]
  recentLeaveRequests: LeaveRequest[]
}

function getLocalDateString(): string {
  return format(new Date(), "yyyy-MM-dd")
}

export function EmployeeAttendanceWidget({
  userId,
  userFullName,
  recentAttendance,
  recentLeaveRequests,
}: EmployeeAttendanceWidgetProps) {
  const supabase = createClient()
  const router = useRouter()
  const [logs, setLogs] = useState<AttendanceLog[]>(recentAttendance)
  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>(recentLeaveRequests)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  useEffect(() => {
    setLogs(recentAttendance)
  }, [recentAttendance])

  useEffect(() => {
    setLeaveRequests(recentLeaveRequests)
  }, [recentLeaveRequests])

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const attendanceChannel = supabase
      .channel("dashboard-attendance-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_logs",
          filter: `user_id=eq.${userId}`,
        },
        () => router.refresh(),
      )
      .subscribe()

    const leaveChannel = supabase
      .channel("dashboard-leave-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leave_requests",
          filter: `user_id=eq.${userId}`,
        },
        () => router.refresh(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(attendanceChannel)
      supabase.removeChannel(leaveChannel)
    }
  }, [router, supabase, userId])

  const { loading, handleClockIn, handleClockOut } = useClockActions({
    userId,
    logs: logs as never[],
    onLogsUpdate: (next) => setLogs(next as AttendanceLog[]),
  })

  const today = getLocalDateString()
  const activeSession = logs.find(
    (log) => log.date === today && log.clock_out === null,
  )
  const todayRecord = logs.find((log) => log.date === today)

  const todayStatus = useMemo(() => {
    if (activeSession) return "Clocked In"
    if (todayRecord?.clock_out) return "Completed"
    return "Not Checked In"
  }, [activeSession, todayRecord])

  const recentLeaves = leaveRequests.slice(0, 5)

  return (
    <div className="space-y-4">

      <div className="rounded-lg border border-neutral-primary bg-surface-neutral-primary px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-label-sm text-foreground-secondary">Today</span>
            <Badge
              variant={
                todayStatus === "Clocked In"
                  ? "success"
                  : todayStatus === "Completed"
                    ? "info"
                    : "warning"
              }
            >
              {todayStatus}
            </Badge>
            <span className="text-body-xs text-foreground-tertiary">
              {currentTime ? format(currentTime, "HH:mm:ss, EEE dd MMM") : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeSession ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={loading}
                onClick={() => handleClockOut(activeSession.id)}
              >
                <RiLogoutBoxLine className="mr-1 size-4" />
                Clock Out
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={loading}
                onClick={() => handleClockIn("Present")}
              >
                <RiLoginBoxLine className="mr-1 size-4" />
                Clock In
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setIsLeaveModalOpen(true)
              }}
            >
              Leave Request
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-label-md text-foreground-primary mb-3">
          Attendance History (Last 7 Days)
        </h4>
        {logs.length === 0 ? (
          <EmptyState
            title="No attendance records"
            description="Clock in to start tracking your attendance."
            placement="inner"
            icon={<RiCheckboxCircleLine className="size-5" />}
          />
        ) : (
          <div className="border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y">
            {logs.slice(0, 7).map((log) => (
              <div key={log.id} className="px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-body-sm text-foreground-primary">
                      {format(new Date(log.date), "EEE, dd MMM yyyy")}
                    </span>
                    <Badge
                      size="sm"
                      variant={log.status === "Late" ? "warning" : "zinc"}
                    >
                      {log.status || "Present"}
                    </Badge>
                  </div>
                  <span className="text-body-xs text-foreground-secondary whitespace-nowrap">
                    {log.clock_in ? format(new Date(log.clock_in), "HH:mm") : "--:--"}
                    {" - "}
                    {log.clock_out ? format(new Date(log.clock_out), "HH:mm") : "Active"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-label-md text-foreground-primary mb-3">
          Leave Requests
        </h4>
        {recentLeaves.length > 0 ? (
          <div className="border-neutral-primary divide-neutral-primary overflow-hidden rounded-lg border divide-y">
            {recentLeaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm text-foreground-primary">
                      {leave.leave_type}
                    </span>
                    <Badge
                      size="sm"
                      variant={
                        leave.status === "approved"
                          ? "success"
                          : leave.status === "rejected"
                            ? "error"
                            : "warning"
                      }
                    >
                      {leave.status === "approved"
                        ? "Approved"
                        : leave.status === "rejected"
                          ? "Rejected"
                          : "Pending"}
                    </Badge>
                  </div>
                  <p className="text-body-xs text-foreground-secondary mt-1">
                    {format(new Date(leave.start_date), "dd MMM yyyy")} -{" "}
                    {format(new Date(leave.end_date), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recent leave requests"
            description="Submit a leave request when you need time off."
            placement="inner"
            icon={<RiCalendarLine className="size-5" />}
          />
        )}
      </div>

      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => {
          setIsLeaveModalOpen(false)
        }}
        userProfile={{ id: userId, full_name: userFullName || null }}
      />
    </div>
  )
}
