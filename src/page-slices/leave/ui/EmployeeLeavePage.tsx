"use client"

import { cn } from "@/lib/utils"
import { TAB_ENTER, useTabSwitched } from "@/shared/hooks/useTabSwitched"
import { RollingValue } from "@/components/rolling-value"
import { AttendanceHistoryList } from "@/app/(main)/attendance/components/AttendanceHistoryList"
import { AttendanceSettings } from "@/page-slices/settings/ui"
import { PageHeader } from "@/components/page-header"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClockControls } from "@/features/attendance-clock"
import { createClient } from "@/shared/api/supabase/client"
import { useMinuteClock } from "@/shared/hooks/useMinuteClock"
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { getLocalDateString } from "@/shared/lib/date"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  annualLeaveSummary,
  businessDaysInYear,
  daysKey,
} from "@/shared/lib/leave"
import { Database } from "@/shared/types/database.types"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { Spinner } from "@/components/ui/spinner"
import dynamic from "next/dynamic"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { EmployeeLeaveList } from "./components/EmployeeLeaveList"

// Markdown renderer only loads when the rules dialog opens.
const LeaveRules = dynamic(
  () => import("./components/LeaveRules").then((m) => m.LeaveRules),
  { loading: LeaveRulesLoading },
)

function LeaveRulesLoading() {
  return (
    <div className="flex justify-center py-8">
      <Spinner className="size-5" />
    </div>
  )
}

// Modal (and its form deps) only loads once the user opens it.
const LeaveRequestModal = dynamic(
  () =>
    import("./components/LeaveRequestModal").then((m) => m.LeaveRequestModal),
  { loading: () => null },
)

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]
type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

interface EmployeeLeavePageProps {
  profile: Profile
  requests: LeaveRequest[]
  statsRequests?: LeaveRequest[]
  attendanceLogs: AttendanceLog[]
  page: number
  pageSize: number
  totalCount: number
}

const isWfh = (type: string) => type === "WFH" || type === "Work From Home"

export function EmployeeLeavePage({
  profile,
  requests,
  statsRequests = [],
  attendanceLogs,
  page,
  pageSize,
  totalCount,
}: EmployeeLeavePageProps) {
  const t = useT("leave")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { activeTab, setActiveTab } = useTabRoute<"attendance" | "leave">({
    basePath: "/leave",
    tabs: ["attendance", "leave"],
    defaultTab: "attendance",
    preserveQuery: true,
    mode: "history",
  })
  const tabSwitched = useTabSwitched(activeTab)
  const { isMounted } = useMountedTabs(activeTab)

  // Only HH:mm is shown, so tick on the minute rather than every second.
  const now = useMinuteClock()
  const [logs, setLogs] = useState<AttendanceLog[]>(attendanceLogs)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMounted, setModalMounted] = useState(false)
  if (isModalOpen && !modalMounted) setModalMounted(true)
  const [editingItem, setEditingItem] = useState<LeaveRequest | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => setLogs(attendanceLogs), [attendanceLogs])

  // Live refresh when a request or attendance log changes elsewhere.
  useEffect(() => {
    const channel = supabase
      .channel("employee-leave-page")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leave_requests",
          filter: `user_id=eq.${profile.id}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_logs",
          filter: `user_id=eq.${profile.id}`,
        },
        () => router.refresh(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router, profile.id])

  const requestsForStats = statsRequests.length > 0 ? statsRequests : requests

  const stats = useMemo(() => {
    const year = new Date().getFullYear()
    const approved = requestsForStats.filter((r) => r.status === "approved")
    const sum = (items: LeaveRequest[]) =>
      items.reduce((total, r) => total + businessDaysInYear(r, year), 0)
    return {
      annual: annualLeaveSummary(
        approved.filter((r) => r.leave_type === "Annual Leave"),
        year,
        profile,
      ),
      sick: sum(approved.filter((r) => r.leave_type === "Sick Leave")),
      wfh: sum(approved.filter((r) => isWfh(r.leave_type))),
    }
  }, [requestsForStats, profile])

  const today = now ? getLocalDateString(now) : ""
  const isOnLeave = Boolean(
    today &&
    requestsForStats.some(
      (r) =>
        r.status === "approved" && r.start_date <= today && r.end_date >= today,
    ),
  )

  const openRequest = useCallback((item: LeaveRequest | null) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }, [])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (newPage + 1).toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const confirmDeleteRequest = async () => {
    if (!deleteLogId) return
    setBusy(true)
    const previous = logs
    try {
      const response = await fetch("/api/attendance/logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_delete", logId: deleteLogId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error)
      setLogs((prev) =>
        prev.map((log) => (log.id === deleteLogId ? payload.data : log)),
      )
      toast.success(t("toastDeleteRequestSent"))
    } catch {
      setLogs(previous)
      toast.error(t("toastDeleteRequestFailed"))
    } finally {
      setBusy(false)
      setDeleteLogId(null)
    }
  }

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setBusy(true)
    try {
      const response = await fetch("/api/leave/requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cancelTarget.id }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error)
      toast.success(t("toastRequestCancelled"))
      setCancelTarget(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t("toastCancelFailed"),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Same order as the admin view: title + actions, tabs, a stats band,
            today's clock row, then the list. */}
        <PageHeader
          className="pt-6 pb-4"
          title={t("pageTitle")}
          actions={
            <Button variant="secondary" onClick={() => openRequest(null)}>
              <RiAddLine data-icon="inline-start" />
              {t("requestLeave")}
            </Button>
          }
        />

        <div className="bleed gutter-x border-border border-b">
          <TabNavigation className="border-b-0">
            <TabNavigationLink
              active={activeTab === "attendance"}
              onClick={() => setActiveTab("attendance")}
              showLeadingIcon={false}
            >
              {t("tabAttendance")}
            </TabNavigationLink>
            <TabNavigationLink
              active={activeTab === "leave"}
              onClick={() => setActiveTab("leave")}
              showLeadingIcon={false}
            >
              {t("tabLeave")}
            </TabNavigationLink>
          </TabNavigation>
        </div>

        {/* Balances (one shared rule, see shared/lib/leave) */}
        <dl className="stat-strip bleed gutter-x border-border border-b py-4">
          <div className="stat-tile">
            <dt className="text-muted-foreground flex items-center gap-2 text-sm">
              {t("statAnnualRemaining")}
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className="text-tertiary-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
              >
                {t("rules")}
              </button>
            </dt>
            {stats.annual.eligible ? (
              <dd className="text-foreground text-xl font-normal tracking-tight tabular-nums">
                <RollingValue>{stats.annual.remaining}</RollingValue>
                <span className="text-tertiary-foreground text-sm tracking-normal">
                  {" "}
                  / {t(daysKey(stats.annual.quota), { n: stats.annual.quota })}
                </span>
              </dd>
            ) : (
              <dd className="text-muted-foreground text-xl font-normal tracking-tight">
                {stats.annual.eligibleFrom
                  ? t("eligibleFrom", {
                      date: format(stats.annual.eligibleFrom, "d MMM yyyy", {
                        locale: dateLocale,
                      }),
                    })
                  : tc("none")}
              </dd>
            )}
            {stats.annual.noteKey && (
              <span className="text-tertiary-foreground text-xs">
                {t(stats.annual.noteKey, stats.annual.noteVars)}
              </span>
            )}
          </div>
          <div className="stat-tile">
            <dt className="text-muted-foreground text-sm">
              {t("statSickThisYear")}
            </dt>
            <dd className="text-foreground text-xl font-normal tracking-tight tabular-nums">
              <RollingValue>{stats.sick}</RollingValue>
              <span className="text-tertiary-foreground text-sm tracking-normal">
                {" "}
                {t(stats.sick === 1 ? "unitDaysOne" : "unitDaysOther")}
              </span>
            </dd>
          </div>
          <div className="stat-tile">
            <dt className="text-muted-foreground text-sm">
              {t("statWfhThisYear")}
            </dt>
            <dd className="text-foreground text-xl font-normal tracking-tight tabular-nums">
              <RollingValue>{stats.wfh}</RollingValue>
              <span className="text-tertiary-foreground text-sm tracking-normal">
                {" "}
                {t(stats.wfh === 1 ? "unitDaysOne" : "unitDaysOther")}
              </span>
            </dd>
          </div>
        </dl>

        {/* Today: time, then auto clock-out and the one primary action */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-4 pb-3">
          <p className="flex items-baseline gap-2">
            <span className="text-foreground tabular-nums">
              {now ? format(now, "HH:mm") : "--:--"}
            </span>
            <span className="text-muted-foreground text-sm">
              {now ? format(now, "EEEE, d MMMM", { locale: dateLocale }) : ""}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* Each employee's own auto clock-out, next to clock in/out. */}
            <AttendanceSettings />
            <ClockControls
              logs={logs}
              onLogsUpdate={setLogs}
              isOnLeave={isOnLeave}
              now={now}
            />
          </div>
        </div>

        <div className="pb-4">
          {isMounted("attendance") && (
            <div
              className={
                activeTab === "attendance"
                  ? cn("block", tabSwitched && TAB_ENTER)
                  : "hidden"
              }
            >
              <AttendanceHistoryList
                logs={logs}
                onRequestDelete={(id) => setDeleteLogId(id)}
              />
            </div>
          )}
          {isMounted("leave") && (
            <div
              className={
                activeTab === "leave"
                  ? cn("block", tabSwitched && TAB_ENTER)
                  : "hidden"
              }
            >
              <EmployeeLeaveList
                requests={requests}
                onEdit={openRequest}
                onCancel={setCancelTarget}
                page={page}
                pageCount={Math.ceil(totalCount / pageSize)}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>

      {modalMounted && (
        <LeaveRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingItem}
          userProfile={profile}
        />
      )}

      <Dialog
        open={deleteLogId !== null}
        onOpenChange={(open) => !open && setDeleteLogId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteLogTitle")}</DialogTitle>
            <DialogDescription>{t("deleteLogDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {tc("cancel")}
            </DialogClose>
            <Button disabled={busy} onClick={confirmDeleteRequest}>
              {t("sendRequest")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelRequestTitle")}</DialogTitle>
            <DialogDescription>{t("cancelRequestDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {tc("back")}
            </DialogClose>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={confirmCancel}
            >
              {t("cancelRequestConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="sm:max-w-[35rem]">
          <DialogHeader>
            <DialogTitle>{t("rulesTitle")}</DialogTitle>
          </DialogHeader>
          <div className="-mx-1 max-h-[70vh] overflow-y-auto px-1">
            <LeaveRules />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
