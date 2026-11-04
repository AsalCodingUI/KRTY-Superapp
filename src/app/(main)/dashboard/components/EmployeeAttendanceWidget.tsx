"use client"

import { leaveTypeLabel } from "@/shared/lib/leave"
import { WeekHours } from "./week-hours"
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
import { useEffect, useMemo, useRef, useState } from "react"
import { ContextTarget } from "@/shared/context-menu"
import { useProofViewer } from "@/entities/leave/ui/ProofLink"
import { LeaveRequestContextMenu } from "@/page-slices/leave/ui/components/leave-context-menu"
import type { LeaveRequestWithProfile } from "@/page-slices/leave/ui/components/AdminLeaveList"
import {
  isShownChange,
  useRealtimeRefresh,
} from "@/page-slices/leave/ui/use-realtime-refresh"

// Read-only "Lihat detail" (right-click on a request).
const LeaveRequestDetailDialog = dynamic(
  () =>
    import("@/page-slices/leave/ui/components/LeaveRequestDetailDialog").then(
      (m) => m.LeaveRequestDetailDialog,
    ),
  { loading: () => null },
)

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
  const t = useT("dashboard")
  const tl = useT("leave")
  const dateLocale = useDateLocale()
  const [logs, setLogs] = useState<AttendanceLog[]>(recentAttendance)
  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>(recentLeaveRequests)
  // Only HH:mm is shown, so tick on the minute rather than every second.
  const currentTime = useMinuteClock()
  const [leaveModalMounted, setLeaveModalMounted] = useState(false)
  if (isLeaveModalOpen && !leaveModalMounted) setLeaveModalMounted(true)
  // Right-click: today's card (clock in / break / out), the leave card and
  // its requests.
  const todayRef = useRef<HTMLDivElement>(null)
  const proof = useProofViewer()
  const [detail, setDetail] = useState<LeaveRequestWithProfile | null>(null)
  const [detailMounted, setDetailMounted] = useState(false)
  if (detail && !detailMounted) setDetailMounted(true)

  useEffect(() => {
    setLogs(recentAttendance)
  }, [recentAttendance])

  useEffect(() => {
    setLeaveRequests(recentLeaveRequests)
  }, [recentLeaveRequests])

  // Debounced; the clock buttons already update `logs`, so their own
  // changes coming back over realtime don't re-render the whole page.
  const refreshForAttendance = useRealtimeRefresh(1_000, (payload) =>
    isShownChange(logs, payload),
  )
  const refreshForLeave = useRealtimeRefresh(1_000)

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
        refreshForAttendance,
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
        refreshForLeave,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(attendanceChannel)
      supabase.removeChannel(leaveChannel)
    }
  }, [refreshForAttendance, refreshForLeave, supabase, userId])

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
      {/* `contents`: the grid still lays out the card itself. */}
      <div ref={todayRef} className="contents">
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
            roll={false}
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
              menuTarget={todayRef}
              menuHref="/leave"
            />
          </div>
          {/* This week's hours, under today's clock. */}
          <div className="border-border mt-auto border-t pt-4">
            <WeekHours logs={logs} now={currentTime ?? new Date()} />
          </div>
        </HomeCard>
      </div>

      <ContextTarget
        type="leave-card"
        label={t("leaveTitle")}
        href="/leave"
        items={() => [
          {
            id: "request",
            label: t("actionRequestLeave"),
            icon: Plus,
            onSelect: () => onLeaveModalChange(true),
          },
        ]}
      >
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
                  <LeaveRequestContextMenu
                    key={leave.id}
                    req={leave}
                    actions={{
                      onDetail: () =>
                        setDetail({
                          ...leave,
                          profiles: {
                            full_name: userFullName ?? "",
                            avatar_url: null,
                          },
                        }),
                      onViewProof: proof.open,
                    }}
                  >
                    <HomeRow
                      title={leaveTypeLabel(leave.leave_type, tl)}
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
                  </LeaveRequestContextMenu>
                )
              })
            )}
          </div>
          <HomeFooter
            label={t("leaveRequests")}
            value={t("leaveRecordedCount", { n: leaveRequests.length })}
            href="/leave"
          />
        </HomeCard>
      </ContextTarget>

      {detailMounted && (
        <LeaveRequestDetailDialog
          request={detail}
          onOpenChange={(open) => !open && setDetail(null)}
        />
      )}
      {proof.viewer}

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
