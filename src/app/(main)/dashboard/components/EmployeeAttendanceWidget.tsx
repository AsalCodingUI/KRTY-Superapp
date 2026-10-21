"use client"

import { ClockControls } from "@/features/attendance-clock"
import { LeaveRequestModal } from "@/page-slices/leave/ui/components/LeaveRequestModal"
import { createClient } from "@/shared/api/supabase/client"
import {
  getAttendanceLogLocalDate,
  getAttendanceSessionState,
  getLocalDateString,
} from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RiCalendarLine, RiCheckboxCircleLine } from "@/shared/ui/lucide-icons"
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

  const today = getLocalDateString()
  const { staleSession, activeSession } = getAttendanceSessionState(
    logs,
    currentTime ?? new Date(),
  )
  const todayRecord = logs.find(
    (log) => getAttendanceLogLocalDate(log) === today,
  )

  const todayStatus = useMemo(() => {
    if (activeSession) return "Sedang bekerja"
    if (staleSession) return "Sesi belum ditutup"
    if (todayRecord?.clock_out) return "Selesai"
    return "Belum clock in"
  }, [activeSession, staleSession, todayRecord])

  const isOnLeaveToday = leaveRequests.some(
    (r) =>
      r.status === "approved" && r.start_date <= today && r.end_date >= today,
  )

  const recentLeaves = leaveRequests.slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              Hari ini
            </span>
            <Badge
              variant={
                todayStatus === "Sedang bekerja"
                  ? "success"
                  : todayStatus === "Sesi belum ditutup"
                    ? "warning"
                    : todayStatus === "Selesai"
                      ? "info"
                      : "warning"
              }
            >
              {todayStatus}
            </Badge>
            <span className="text-muted-foreground/70 text-xs">
              {currentTime ? format(currentTime, "HH:mm:ss, EEE dd MMM") : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Same control as Leave & Attendance (status, break, confirm). */}
            <ClockControls
              logs={logs}
              onLogsUpdate={setLogs}
              isOnLeave={isOnLeaveToday}
              now={currentTime}
            />
            <Button variant="outline" onClick={() => setIsLeaveModalOpen(true)}>
              Ajukan cuti
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-foreground mb-3 text-sm font-medium">
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
          <div className="divide-border divide-y">
            {logs.slice(0, 7).map((log) => (
              <div key={log.id} className="px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-foreground text-sm">
                      {format(
                        new Date(getAttendanceLogLocalDate(log)),
                        "EEE, dd MMM yyyy",
                      )}
                    </span>
                    <Badge
                      variant={log.status === "Late" ? "warning" : "secondary"}
                    >
                      {log.status || "Present"}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {log.clock_in
                      ? format(new Date(log.clock_in), "HH:mm")
                      : "--:--"}
                    {" - "}
                    {log.clock_out
                      ? format(new Date(log.clock_out), "HH:mm")
                      : "Active"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-foreground mb-3 text-sm font-medium">
          Leave Requests
        </h4>
        {recentLeaves.length > 0 ? (
          <div className="divide-border divide-y">
            {recentLeaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm">
                      {leave.leave_type}
                    </span>
                    <Badge
                      variant={
                        leave.status === "approved"
                          ? "success"
                          : leave.status === "rejected"
                            ? "destructive"
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
                  <p className="text-muted-foreground mt-1 text-xs">
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
