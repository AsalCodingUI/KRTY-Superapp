"use client"

import { AttendanceHistoryList } from "@/app/(main)/attendance/components/AttendanceHistoryList"
import { useClockActions } from "@/features/attendance-clock/model/useClockActions"
import { createClient } from "@/shared/api/supabase/client"
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { calculateBusinessDays } from "@/shared/lib/date"
import {
  getAttendanceLogLocalDate,
  getAttendanceSessionState,
  getLocalDateString,
} from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import { DataTable } from "@/components/data-table"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { TableSection } from "@/components/table-section"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiFileTextLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiUserSmileLine,
} from "@/shared/ui/lucide-icons"
import { format, parseISO } from "date-fns"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { columns } from "./components/Columns"
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

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LeaveRequest | null>(null)
  const { activeTab, setActiveTab } = useTabRoute<"attendance" | "leave">({
    basePath: "/leave",
    tabs: ["attendance", "leave"],
    defaultTab: "attendance",
    preserveQuery: true,
    mode: "history",
  })
  const { isMounted } = useMountedTabs(activeTab)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [logs, setLogs] = useState<AttendanceLog[]>(attendanceLogs)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)
  const [isStaleDialogOpen, setIsStaleDialogOpen] = useState(false)
  const [hasClientMounted, setHasClientMounted] = useState(false)

  const {
    loading,
    handleClockIn,
    handleClockOut,
    handleToggleBreak,
    handleResolvePreviousSession,
  } =
    useClockActions({
      logs,
      onLogsUpdate: setLogs,
    })

  useEffect(() => {
    setLogs(attendanceLogs)
  }, [attendanceLogs])

  // --- 1. LOGIC REALTIME (Agar otomatis refresh saat status berubah/diedit) ---
  useEffect(() => {
    const channel = supabase
      .channel("employee-leave-changes")
      .on(
        "postgres_changes",
        {
          event: "*", // Dengarkan semua event (INSERT, UPDATE)
          schema: "public",
          table: "leave_requests",
          filter: `user_id=eq.${profile.id}`, // Hanya dengarkan data milik user ini
        },
        () => {
          // Refresh halaman server component
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router, profile.id])

  useEffect(() => {
    const channel = supabase
      .channel("employee-attendance")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance_logs",
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router, profile.id])

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setHasClientMounted(true)
  }, [])

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (newPage + 1).toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const pageCount = Math.ceil(totalCount / pageSize)
  const requestsForStats = statsRequests.length > 0 ? statsRequests : requests

  // Open Edit Modal
  const handleEdit = (item: LeaveRequest) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  // Open Add Modal
  const handleAdd = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const today = currentTime ? getLocalDateString(currentTime) : ""
  const { staleSession, activeSession } = getAttendanceSessionState(
    logs,
    currentTime ?? new Date(),
  )

  const isOnLeave = useMemo(() => {
    if (!today) return false
    return requestsForStats.some(
      (req) =>
        req.status === "approved" &&
        req.start_date <= today &&
        req.end_date >= today,
    )
  }, [requestsForStats, today])

  const [selectedStatus, setSelectedStatus] = useState<string>(
    isOnLeave ? "Cuti Masuk" : "Present",
  )

  useEffect(() => {
    if (!activeSession) {
      setSelectedStatus(isOnLeave ? "Cuti Masuk" : "Present")
    }
  }, [isOnLeave, activeSession])

  useEffect(() => {
    if (staleSession && !activeSession) {
      setIsStaleDialogOpen(true)
      return
    }

    setIsStaleDialogOpen(false)
  }, [staleSession, activeSession])

  const getStatusLabel = (val: string) => {
    if (val === "Present") return "Available"
    return val
  }

  const leaveStats = useMemo(() => {
    const MAX_LEAVE = 12
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear(), 11, 31)
    const overlapsYear = (req: LeaveRequest) => {
      const start = new Date(req.start_date)
      const end = new Date(req.end_date)
      return start <= yearEnd && end >= yearStart
    }

    const approvedAnnual = requestsForStats.filter(
      (req) =>
        req.status === "approved" &&
        req.leave_type === "Annual Leave" &&
        overlapsYear(req),
    )
    const approvedSick = requestsForStats.filter(
      (req) =>
        req.status === "approved" &&
        req.leave_type === "Sick Leave" &&
        overlapsYear(req),
    )
    const approvedWfh = requestsForStats.filter(
      (req) =>
        req.status === "approved" &&
        (req.leave_type === "WFH" || req.leave_type === "Work From Home") &&
        overlapsYear(req),
    )

    const sumDays = (items: LeaveRequest[]) =>
      items.reduce((total, req) => {
        const start = new Date(req.start_date)
        const end = new Date(req.end_date)
        const clampedStart = start < yearStart ? yearStart : start
        const clampedEnd = end > yearEnd ? yearEnd : end
        if (clampedEnd < clampedStart) return total
        const days = calculateBusinessDays(clampedStart, clampedEnd)
        return total + days
      }, 0)

    const usedAnnual = sumDays(approvedAnnual)
    const sickDays = sumDays(approvedSick)
    const wfhDays = sumDays(approvedWfh)

    const annualRemaining = Math.max(0, MAX_LEAVE - usedAnnual)

    return {
      annualUsed: Math.max(0, usedAnnual),
      annualRemaining,
      annualTotal: MAX_LEAVE,
      sickDays,
      wfhDays,
    }
  }, [requestsForStats])

  const confirmDelete = async () => {
    if (!pendingDeleteId) return
    setDeleteConfirmOpen(false)

    const oldLogs = logs
    setLogs((prev) =>
      prev.map((log) =>
        log.id === pendingDeleteId
          ? { ...log, notes: "DELETE_REQUESTED" }
          : log,
      ),
    )

    try {
      const response = await fetch("/api/attendance/logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_delete",
          logId: pendingDeleteId,
        }),
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to request delete")
      }
    } catch (error) {
      setLogs(oldLogs)
    } finally {
      setPendingDeleteId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col">
        <Dialog open={isStaleDialogOpen} onOpenChange={setIsStaleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sesi Sebelumnya Masih Aktif</DialogTitle>
            </DialogHeader>
            <div>
              <p className="text-body-sm text-muted-foreground">
                Kami mendeteksi sesi attendance sebelumnya belum tertutup. Ini
                biasanya terjadi kalau laptop mati, browser tertutup, atau clock
                out gagal terkirim.
              </p>
              {staleSession && (
                <p className="text-body-sm text-muted-foreground mt-3">
                  Tutup sesi dari{" "}
                  {format(
                    parseISO(getAttendanceLogLocalDate(staleSession)),
                    "dd MMM yyyy",
                  )}{" "}
                  dulu sebelum memulai sesi baru.
                </p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button size="sm" variant="outline">Nanti</Button>
              </DialogClose>
              {staleSession && (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={loading}
                  onClick={() => handleResolvePreviousSession(staleSession.id)}
                >
                  Tutup Sesi Sebelumnya
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
          <RiUserSmileLine className="size-4 text-muted-foreground" />
          <p className="text-label-md text-foreground">
            Leave & Attendance Center
          </p>
        </div>

        <div className="flex flex-col rounded-xxl bg-card">
          <div className="grid grid-cols-2 gap-lg px-5 py-2 lg:grid-cols-5">
            <div className="border-border bg-card flex flex-col gap-1 rounded-lg border px-4 py-3 col-span-2">
              <p className="text-label-sm text-muted-foreground">
                Current Time
              </p>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-heading-md text-foreground">
                    {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
                  </p>
                  <p className="text-body-sm text-muted-foreground">
                    {currentTime ? format(currentTime, "EEEE, dd MMM") : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {!currentTime ? (
                    // SSR placeholder — keeps component tree stable to avoid Radix ID hydration mismatch
                    <div className="h-[28px]" />
                  ) : staleSession && !activeSession ? (
                    <div className="flex flex-col items-end gap-2">
                      <p className="text-body-xs text-destructive text-right">
                        Sesi {format(parseISO(getAttendanceLogLocalDate(staleSession)), "dd MMM yyyy")} belum ditutup.
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleResolvePreviousSession(staleSession.id)
                        }
                        disabled={loading}
                      >
                        <RiLogoutBoxLine className="mr-2 size-4" />
                        Tutup Sesi Sebelumnya
                      </Button>
                    </div>
                  ) : !activeSession ? (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" type="button">
                            {getStatusLabel(selectedStatus)}
                            <RiArrowDownSLine className="text-muted-foreground ml-2 size-4 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => setSelectedStatus("Present")}
                          >
                            Available
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSelectedStatus("Lembur")}
                          >
                            Lembur
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSelectedStatus("Cuti Masuk")}
                          >
                            Cuti Masuk
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="sm"
                        onClick={() => handleClockIn(selectedStatus)}
                        disabled={loading || Boolean(staleSession)}
                      >
                        <RiLoginBoxLine className="mr-2 size-4" />
                        Clock In
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleToggleBreak(
                            activeSession.id,
                            activeSession.is_break || false,
                          )
                        }
                        disabled={loading}
                      >
                        {activeSession.is_break ? "End Break" : "Break"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleClockOut(activeSession.id)}
                        variant="destructive"
                        disabled={loading}
                      >
                        <RiLogoutBoxLine className="mr-2 size-4" />
                        Clock Out
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border-border bg-card flex flex-col gap-1 rounded-lg border px-4 py-3">
              <p className="text-label-sm text-muted-foreground">
                Annual Leave Balance
              </p>
              <p className="text-heading-md text-foreground">
                {leaveStats.annualRemaining}/{leaveStats.annualTotal} Days
              </p>
            </div>

            <div className="border-border bg-card flex flex-col gap-1 rounded-lg border px-4 py-3">
              <p className="text-label-sm text-muted-foreground">
                Sick Leave
              </p>
              <p className="text-heading-md text-foreground">
                {leaveStats.sickDays}
              </p>
            </div>

            <div className="border-border bg-card flex flex-col gap-1 rounded-lg border px-4 py-3">
              <p className="text-label-sm text-muted-foreground">
                Work From Home
              </p>
              <p className="text-heading-md text-foreground">
                {leaveStats.wfhDays}
              </p>
            </div>
          </div>

          <div className="px-5 pt-2 border-b border-border">
            <div className="xl:hidden space-y-3 pb-2">
              {hasClientMounted ? (
                <Select
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "attendance" | "leave")
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendance">Attendance History</SelectItem>
                    <SelectItem value="leave">Leave Requests</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="border-border bg-card h-9 w-full rounded-lg border" />
              )}
              {isMounted("leave") && activeTab === "leave" && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTermsOpen(true)}
                    className="w-full"
                  >
                    <RiFileTextLine className="mr-2 size-3.5" />
                    Terms & Conditions
                  </Button>
                  <Button size="sm" onClick={handleAdd} className="w-full">
                    <RiAddLine className="mr-2 size-3.5" />
                    Request Leave
                  </Button>
                </div>
              )}
            </div>

            <div className="hidden xl:flex items-start justify-between gap-4">
              <TabNavigation className="border-b-0">
                <TabNavigationLink
                  active={activeTab === "attendance"}
                  onClick={() => setActiveTab("attendance")}
                >
                  Attendance History
                </TabNavigationLink>
                <TabNavigationLink
                  active={activeTab === "leave"}
                  onClick={() => setActiveTab("leave")}
                >
                  Leave Requests
                </TabNavigationLink>
              </TabNavigation>

              {isMounted("leave") && activeTab === "leave" && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTermsOpen(true)}
                  >
                    <RiFileTextLine className="mr-2 size-3.5" />
                    Read Terms &amp; Conditions
                  </Button>
                  <Button size="sm" onClick={handleAdd}>
                    <RiAddLine className="mr-2 size-3.5" />
                    Request Leave
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="p-5">
            {isMounted("attendance") && (
              <div className={activeTab === "attendance" ? "block space-y-5" : "hidden space-y-5"}>
                <AttendanceHistoryList
                  logs={logs}
                  onRequestDelete={(id) => {
                    setPendingDeleteId(id)
                    setDeleteConfirmOpen(true)
                  }}
                />
              </div>
            )}

            {isMounted("leave") && (
              <div className={activeTab === "leave" ? "block space-y-5" : "hidden space-y-5"}>
                <TableSection
                  title="Leave Requests"
                >
                  <DataTable
                    data={requests}
                    columns={columns(handleEdit)}
                    manualPagination={true}
                    pageCount={pageCount}
                    pageIndex={page - 1}
                    onPageChange={handlePageChange}
                    onCreate={undefined}
                    showExport={false}
                    showViewOptions={false}
                    enableSelection={false}
                    enableHover={false}
                    searchKey="reason"
                    showTableWrapper={false}
                    showFilterbar={false}
                  />
                </TableSection>
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

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-body-sm text-muted-foreground">
              Apakah Anda yakin ingin mengajukan penghapusan data attendance ini?
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="sm" variant="outline" className="w-full sm:w-fit">
                Cancel
              </Button>
            </DialogClose>
            <Button size="sm" className="w-full sm:w-fit" onClick={confirmDelete}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Terms &amp; Conditions</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <LeaveRules />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button size="sm" variant="outline" className="w-full sm:w-fit">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
