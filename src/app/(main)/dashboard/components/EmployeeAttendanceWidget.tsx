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
import { ArrowUpRight, Plus } from "lucide-react"
import {
  HomeCard,
  HomeEmpty,
  HomeFigure,
  HomeFooter,
  HomeIconLink,
  HomeRow,
} from "./home-card"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

// Modal (and its form deps) only loads once the user opens it.
const LeaveRequestModal = dynamic(() =>
  import("@/page-slices/leave/ui/components/LeaveRequestModal").then(
    (m) => m.LeaveRequestModal,
  ),
)

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

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

  const statusVariant =
    todayStatus === "Sedang bekerja"
      ? "success"
      : todayStatus === "Selesai"
        ? "info"
        : "warning"

  const leaveLabel = (status: string | null) =>
    status === "approved"
      ? { variant: "success" as const, label: "Disetujui" }
      : status === "rejected"
        ? { variant: "destructive" as const, label: "Ditolak" }
        : { variant: "warning" as const, label: "Menunggu" }

  // Two cards side by side: today's clock, and leave.
  return (
    <>
      <HomeCard
        title="Hari ini"
        badge={<Badge variant={statusVariant}>{todayStatus}</Badge>}
        actions={
          <HomeIconLink href="/leave" label="Buka kehadiran">
            <ArrowUpRight />
          </HomeIconLink>
        }
      >
        <HomeFigure
          value={currentTime ? format(currentTime, "HH:mm") : "--:--"}
          hint={
            currentTime
              ? format(currentTime, "EEEE, d MMMM", { locale: idLocale })
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
            <HomeEmpty>Clock in untuk mulai mencatat kehadiranmu.</HomeEmpty>
          ) : (
            logs.slice(0, 4).map((log) => (
              <HomeRow
                key={log.id}
                title={format(
                  new Date(getAttendanceLogLocalDate(log)),
                  "EEE, d MMM",
                  {
                    locale: idLocale,
                  },
                )}
                trailing={
                  <>
                    {log.status === "Late" && (
                      <Badge variant="warning">Terlambat</Badge>
                    )}
                    <span className="text-muted-foreground text-[13px]">
                      {log.clock_in
                        ? format(new Date(log.clock_in), "HH:mm")
                        : "--:--"}
                      {" – "}
                      {log.clock_out
                        ? format(new Date(log.clock_out), "HH:mm")
                        : "aktif"}
                    </span>
                  </>
                }
              />
            ))
          )}
        </div>
      </HomeCard>

      <HomeCard
        title="Cuti"
        actions={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            aria-label="Ajukan cuti"
            title="Ajukan cuti"
            onClick={() => onLeaveModalChange(true)}
          >
            <Plus />
          </Button>
        }
      >
        <HomeFigure value={leaveBalance} unit="hari" hint="Sisa cuti tahunan" />
        <div className="flex flex-col">
          {recentLeaves.length === 0 ? (
            <HomeEmpty>Belum ada pengajuan cuti.</HomeEmpty>
          ) : (
            recentLeaves.slice(0, 3).map((leave) => {
              const badge = leaveLabel(leave.status)
              return (
                <HomeRow
                  key={leave.id}
                  title={leave.leave_type}
                  subtitle={
                    format(new Date(leave.start_date), "d MMM", {
                      locale: idLocale,
                    }) +
                    (leave.end_date !== leave.start_date
                      ? ` – ${format(new Date(leave.end_date), "d MMM yyyy", { locale: idLocale })}`
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
          label="Pengajuan"
          value={`${leaveRequests.length} tercatat`}
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
