"use client"

import { AttendanceHistoryList } from "@/app/(main)/attendance/components/AttendanceHistoryList"
import { AttendanceHistoryTable } from "@/app/(main)/attendance/components/AttendanceHistoryTable"
import { DataTable } from "@/components/data-table"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
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
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { getLocalDateString } from "@/shared/lib/date"
import { annualLeaveSummary, businessDaysInYear } from "@/shared/lib/leave"
import { Database } from "@/shared/types/database.types"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { columns } from "./components/Columns"
import { EmployeeLeaveList } from "./components/EmployeeLeaveList"
import { LeaveRequestModal } from "./components/LeaveRequestModal"
import { LeaveRules } from "./components/LeaveRules"

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
  const { isMounted } = useMountedTabs(activeTab)
  const [view, setView] = useViewMode("leave")

  const [now, setNow] = useState<Date | null>(null)
  const [logs, setLogs] = useState<AttendanceLog[]>(attendanceLogs)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LeaveRequest | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => setLogs(attendanceLogs), [attendanceLogs])

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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

  const openRequest = (item: LeaveRequest | null) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

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
      toast.success("Permintaan hapus dikirim ke admin")
    } catch {
      setLogs(previous)
      toast.error("Gagal mengirim permintaan hapus")
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
      toast.success("Pengajuan dibatalkan")
      setCancelTarget(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Gagal membatalkan pengajuan",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Today: time + the one primary action (clock in/out) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-4">
            <p className="flex items-baseline gap-2">
              <span className="text-base font-medium tabular-nums">
                {now ? format(now, "HH:mm") : "--:--"}
              </span>
              <span className="text-muted-foreground text-sm">
                {now ? format(now, "EEEE, d MMMM", { locale: idLocale }) : ""}
              </span>
            </p>
            <ClockControls
              logs={logs}
              onLogsUpdate={setLogs}
              isOnLeave={isOnLeave}
              now={now}
            />
          </div>
          <Button variant="secondary" onClick={() => openRequest(null)}>
            <RiAddLine data-icon="inline-start" />
            Ajukan cuti
          </Button>
        </div>

        {/* Balances (one shared rule, see shared/lib/leave) */}
        <dl className="flex flex-wrap gap-x-16 gap-y-4 py-1">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground flex items-center gap-2 text-sm">
              Sisa cuti tahunan
              <button
                type="button"
                onClick={() => setRulesOpen(true)}
                className="text-muted-foreground/70 hover:text-foreground text-xs underline-offset-2 hover:underline"
              >
                Aturan
              </button>
            </dt>
            {stats.annual.eligible ? (
              <dd className="text-lg font-medium tabular-nums">
                {stats.annual.remaining}
                <span className="text-muted-foreground text-sm font-normal">
                  {" "}
                  / {stats.annual.quota} hari
                </span>
              </dd>
            ) : (
              <dd className="text-muted-foreground text-lg font-medium">
                {stats.annual.eligibleFrom
                  ? `Mulai ${format(stats.annual.eligibleFrom, "d MMM yyyy", { locale: idLocale })}`
                  : "Tidak ada"}
              </dd>
            )}
            {stats.annual.note && (
              <span className="text-muted-foreground/70 text-xs">
                {stats.annual.note}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-sm">Sakit tahun ini</dt>
            <dd className="text-lg font-medium tabular-nums">
              {stats.sick}
              <span className="text-muted-foreground text-sm font-normal">
                {" "}
                hari
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-sm">WFH tahun ini</dt>
            <dd className="text-lg font-medium tabular-nums">
              {stats.wfh}
              <span className="text-muted-foreground text-sm font-normal">
                {" "}
                hari
              </span>
            </dd>
          </div>
        </dl>

        <div className="flex flex-col">
          <div className="flex items-end justify-between gap-4 border-b">
            <TabNavigation className="border-b-0">
              <TabNavigationLink
                active={activeTab === "attendance"}
                onClick={() => setActiveTab("attendance")}
              >
                Kehadiran
              </TabNavigationLink>
              <TabNavigationLink
                active={activeTab === "leave"}
                onClick={() => setActiveTab("leave")}
              >
                Cuti
              </TabNavigationLink>
            </TabNavigation>
            <ViewToggle
              value={view}
              onValueChange={setView}
              className="mb-1.5"
            />
          </div>

          <div className="py-4">
            {isMounted("attendance") && (
              <div className={activeTab === "attendance" ? "block" : "hidden"}>
                {view === "table" ? (
                  <AttendanceHistoryTable
                    logs={logs}
                    onRequestDelete={(id) => setDeleteLogId(id)}
                  />
                ) : (
                  <AttendanceHistoryList
                    logs={logs}
                    onRequestDelete={(id) => setDeleteLogId(id)}
                  />
                )}
              </div>
            )}
            {isMounted("leave") && (
              <div className={activeTab === "leave" ? "block" : "hidden"}>
                {view === "table" ? (
                  <DataTable
                    data={requests}
                    columns={columns({
                      onEdit: openRequest,
                      onCancel: setCancelTarget,
                    })}
                    manualPagination
                    pageCount={Math.ceil(totalCount / pageSize)}
                    pageIndex={page - 1}
                    onPageChange={handlePageChange}
                    showExport={false}
                    showViewOptions={false}
                    enableSelection={false}
                    enableHover={false}
                    showTableWrapper={false}
                    showFilterbar={false}
                  />
                ) : (
                  <EmployeeLeaveList
                    requests={requests}
                    onEdit={openRequest}
                    onCancel={setCancelTarget}
                    page={page}
                    pageCount={Math.ceil(totalCount / pageSize)}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingItem}
        userProfile={profile}
      />

      <Dialog
        open={deleteLogId !== null}
        onOpenChange={(open) => !open && setDeleteLogId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minta hapus data kehadiran?</DialogTitle>
            <DialogDescription>
              Admin akan meninjau permintaan ini sebelum datanya dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Batal
            </DialogClose>
            <Button disabled={busy} onClick={confirmDeleteRequest}>
              Kirim permintaan
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
            <DialogTitle>Batalkan pengajuan?</DialogTitle>
            <DialogDescription>
              Pengajuan yang belum disetujui ini akan dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Kembali
            </DialogClose>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={confirmCancel}
            >
              Batalkan pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="sm:max-w-[35rem]">
          <DialogHeader>
            <DialogTitle>Aturan cuti</DialogTitle>
          </DialogHeader>
          <div className="-mx-1 max-h-[70vh] overflow-y-auto px-1">
            <LeaveRules />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
