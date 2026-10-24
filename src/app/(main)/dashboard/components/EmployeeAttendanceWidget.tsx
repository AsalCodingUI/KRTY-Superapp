"use client"

import { ClockControls } from "@/features/attendance-clock"
import { createClient } from "@/shared/api/supabase/client"
import { useMinuteClock } from "@/shared/hooks/useMinuteClock"
import {
  getAttendanceLogLocalDate,
  getAttendanceSessionState,
  getLocalDateString,
} from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, Plus } from "@/components/icons"
import {
  HomeCard,
  HomeEmpty,
  HomeFigure,
  HomeFooter,
  HomeIconLink,
  HomeRow,
} from "./home-card"
import { format } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

// Modal (and its form deps) only loads once the user opens it.
const LeaveRequestModal = dynamic(
  () =>
    import("@/page-slices/leave/ui/components/LeaveRequestModal").then(
      (m) => m.LeaveRequestModal,
    ),
  { loading: () => null },
)

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

const statusKey = {
  working: "statusWorking",
  sessionOpen: "statusSessionOpen",
  done: "statusDone",
  notClockedIn: "statusNotClockedIn",
} as const

interface EmployeeAttendanceWidgetProps {
  userId: string
  userFullName?: string | null
  recentAttendance: AttendanceLog[]
  recentLeaveRequests: LeaveRequest[]
  leaveBalance: number
  isLeaveModalOpen: boolean
  onLeaveModalChange: (open: boolean) => void
}

export function EmployeeAttendanceWidget({
  userId,
  userFullName,
  recentAttendance,
  recentLeaveRequests,
  leaveBalance,
  isLeaveModalOpen,
  onLeaveModalChange,
}: EmployeeAttendanceWidgetProps) {
  const supabase = createClient()
  const router = useRouter()
  const t = useT("dashboard")
  const dateLocale = useDateLocale()
  const [logs, setLogs] = useState<AttendanceLog[]>(recentAttendance)
  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>(recentLeaveRequests)
  // Only HH:mm is shown, so tick on the minute rather than every second.
  const currentTime = useMinuteClock()
  const [leaveModalMounted, setLeaveModalMounted] = useState(false)
  if (isLeaveModalOpen && !leaveModalMounted) setLeaveModalMounted(true)

  useEffect(() => {
    setLogs(recentAttendance)
  }, [recentAttendance])

  useEffect(() => {
    setLeaveRequests(recentLeaveRequests)
  }, [recentLeaveRequests])

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
    if (activeSession) return "working"
    if (staleSession) return "sessionOpen"
    if (todayRecord?.clock_out) return "done"
    return "notClockedIn"
  }, [activeSession, staleSession, todayRecord])

  const isOnLeaveToday = leaveRequests.some(
    (r) =>
      r.status === "approved" && r.start_date <= today && r.end_date >= today,
  )

  const recentLeaves = leaveRequests.slice(0, 5)

  const statusVariant =
    todayStatus === "working"
      ? "success"
      : todayStatus === "done"
        ? "info"
        : "warning"

  const leaveLabel = (status: string | null) =>
    status === "approved"
      ? { variant: "success" as const, label: t("leaveApproved") }
      : status === "rejected"
        ? { variant: "destructive" as const, label: t("leaveRejected") }
        : { variant: "warning" as const, label: t("leavePending") }

  // Two cards side by side: today's clock, and leave.
  return (
    <>
      <HomeCard
        title={t("todayTitle")}
        badge={
          <Badge variant={statusVariant}>{t(statusKey[todayStatus])}</Badge>
        }
        actions={
          <HomeIconLink href="/leave" label={t("openAttendance")}>
            <ArrowUpRight />
          </HomeIconLink>
        }
      >
        <HomeFigure
          value={currentTime ? format(currentTime, "HH:mm") : "--:--"}
          hint={
            currentTime
              ? format(currentTime, "EEEE, d MMMM", { locale: dateLocale })
              : "\u00a0"
          }
        />
        <div className="flex flex-wrap items-center gap-2">
          {/* Same control as Leave & Attendance (status, break, confirm). */}
          <ClockControls
            logs={logs}
            onLogsUpdate={setLogs}
            isOnLeave={isOnLeaveToday}
            now={currentTime}
          />
        </div>
        <div className="flex flex-col">
          {logs.length === 0 ? (
            <HomeEmpty>{t("attendanceEmpty")}</HomeEmpty>
          ) : (
            logs.slice(0, 4).map((log) => (
              <HomeRow
                key={log.id}
                title={format(
                  new Date(getAttendanceLogLocalDate(log)),
                  "EEE, d MMM",
                  {
                    locale: dateLocale,
                  },
                )}
                trailing={
                  <>
                    {log.status === "Late" && (
                      <Badge variant="warning">{t("attendanceLate")}</Badge>
                    )}
                    <span className="text-muted-foreground text-[13px]">
                      {log.clock_in
                        ? format(new Date(log.clock_in), "HH:mm")
                        : "--:--"}
                      {" – "}
                      {log.clock_out
                        ? format(new Date(log.clock_out), "HH:mm")
                        : t("attendanceActive")}
                    </span>
                  </>
                }
              />
            ))
          )}
        </div>
      </HomeCard>

      <HomeCard
        title={t("leaveTitle")}
        actions={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label={t("actionRequestLeave")}
            title={t("actionRequestLeave")}
            onClick={() => onLeaveModalChange(true)}
          >
            <Plus />
          </Button>
        }
      >
        <HomeFigure
          value={leaveBalance}
          unit={t(leaveBalance === 1 ? "daysUnitOne" : "daysUnit")}
          hint={t("leaveBalanceHint")}
        />
        <div className="flex flex-col">
          {recentLeaves.length === 0 ? (
            <HomeEmpty>{t("leaveEmpty")}</HomeEmpty>
          ) : (
            recentLeaves.slice(0, 3).map((leave) => {
              const badge = leaveLabel(leave.status)
              return (
                <HomeRow
                  key={leave.id}
                  title={leave.leave_type}
                  subtitle={
                    format(new Date(leave.start_date), "d MMM", {
                      locale: dateLocale,
                    }) +
                    (leave.end_date !== leave.start_date
                      ? ` – ${format(new Date(leave.end_date), "d MMM yyyy", { locale: dateLocale })}`
                      : "")
                  }
                  trailing={
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  }
                />
              )
            })
          )}
        </div>
        <HomeFooter
          label={t("leaveRequests")}
          value={t("leaveRecordedCount", { n: leaveRequests.length })}
          href="/leave/leave"
        />
      </HomeCard>

      {leaveModalMounted && (
        <LeaveRequestModal
          isOpen={isLeaveModalOpen}
          onClose={() => onLeaveModalChange(false)}
          userProfile={{ id: userId, full_name: userFullName || null }}
        />
      )}
    </>
  )
}
