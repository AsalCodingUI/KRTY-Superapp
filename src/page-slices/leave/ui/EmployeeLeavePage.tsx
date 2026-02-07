"use client"

import { AttendanceHistoryList } from "@/app/(main)/attendance/components/AttendanceHistoryList"
import { useClockActions } from "@/features/attendance-clock/model/useClockActions"
import { createClient } from "@/shared/api/supabase/client"
import { calculateBusinessDays } from "@/shared/lib/date"
import { Database } from "@/shared/types/database.types"
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TabNavigation,
  TabNavigationLink,
} from "@/shared/ui"
import { DataTable } from "@/shared/ui/data/DataTable"
import {
  RiArrowDownSLine,
  RiAddLine,
  RiFileTextLine,
  RiLoginBoxLine,
  RiLogoutBoxLine,
  RiUserSmileLine,
} from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
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
  attendanceLogs: AttendanceLog[]
  page: number
  pageSize: number
  totalCount: number
}

export function EmployeeLeavePage({
  profile,
  requests,
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
  const [activeTab, setActiveTab] = useState<"attendance" | "leave">(
    "attendance",
  )
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [logs, setLogs] = useState<AttendanceLog[]>(attendanceLogs)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [termsOpen, setTermsOpen] = useState(false)

  const { loading, handleClockIn, handleClockOut, handleToggleBreak } =
    useClockActions({
      userId: profile.id,
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

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (newPage + 1).toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const pageCount = Math.ceil(totalCount / pageSize)

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

  const today = currentTime ? format(currentTime, "yyyy-MM-dd") : ""
  const activeSession = logs.find(
    (log) => log.date === today && log.clock_out === null,
  )

  const isOnLeave = useMemo(() => {
    if (!today) return false
    return requests.some(
      (req) =>
        req.status === "approved" &&
        req.start_date <= today &&
        req.end_date >= today,
    )
  }, [requests, today])

  const [selectedStatus, setSelectedStatus] = useState<string>(
    isOnLeave ? "Cuti Masuk" : "Present",
  )

  useEffect(() => {
    if (!activeSession) {
      setSelectedStatus(isOnLeave ? "Cuti Masuk" : "Present")
    }
  }, [isOnLeave, activeSession])

  const getStatusLabel = (val: string) => {
    if (val === "Present") return "Available"
    return val
  }

  const leaveStats = useMemo(() => {
    const MAX_LEAVE = 12
    const approvedAnnual = requests.filter(
      (req) => req.status === "approved" && req.leave_type === "Annual Leave",
    )
    const approvedSick = requests.filter(
      (req) => req.status === "approved" && req.leave_type === "Sick Leave",
    )
    const approvedWfh = requests.filter(
      (req) => req.status === "approved" && req.leave_type === "WFH",
    )

    const sumDays = (items: LeaveRequest[]) =>
      items.reduce((total, req) => {
        const days = calculateBusinessDays(
          new Date(req.start_date),
          new Date(req.end_date),
        )
        return total + days
      }, 0)

    const usedAnnual = sumDays(approvedAnnual)
    const sickDays = sumDays(approvedSick)
    const wfhDays = sumDays(approvedWfh)

    return {
      annualUsed: Math.max(0, usedAnnual),
      annualTotal: MAX_LEAVE,
      sickDays,
      wfhDays,
    }
  }, [requests])

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
      const { error } = await supabase
        .from("attendance_logs")
        .update({ notes: "DELETE_REQUESTED" })
        .eq("id", pendingDeleteId)

      if (error) throw error
    } catch (error) {
      setLogs(oldLogs)
    } finally {
      setPendingDeleteId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 rounded-[14px] px-5 pt-4 pb-3">
          <RiUserSmileLine className="size-4 text-foreground-secondary" />
          <p className="text-label-md text-foreground-primary">
            Leave & Attendance Center
          </p>
        </div>

        <div className="bg-surface-neutral-primary flex flex-col rounded-[14px]">
          <div className="grid grid-cols-1 gap-md px-5 py-2 sm:grid-cols-2 lg:grid-cols-5">
            <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-[10px] border px-4 py-3 lg:col-span-2">
              <p className="text-label-sm text-foreground-secondary">
                Current Time
              </p>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-heading-md text-foreground-primary">
                    {currentTime ? format(currentTime, "HH:mm:ss") : "--:--:--"}
                  </p>
                  <p className="text-body-sm text-foreground-secondary">
                    {currentTime ? format(currentTime, "EEEE, dd MMM") : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!activeSession ? (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="secondary">
                            {getStatusLabel(selectedStatus)}
                            <RiArrowDownSLine className="text-foreground-secondary ml-2 size-4 shrink-0" />
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
                        disabled={loading}
                      >
                        <RiLoginBoxLine className="mr-2 size-4" />
                        Clock In
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
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

            <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-[10px] border px-4 py-3">
              <p className="text-label-sm text-foreground-secondary">
                Annual Leave Balance
              </p>
              <p className="text-heading-md text-foreground-primary">
                {leaveStats.annualUsed}/{leaveStats.annualTotal} Days
              </p>
            </div>

            <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-[10px] border px-4 py-3">
              <p className="text-label-sm text-foreground-secondary">
                Sick Leave
              </p>
              <p className="text-heading-md text-foreground-primary">
                {leaveStats.sickDays}
              </p>
            </div>

            <div className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-[10px] border px-4 py-3">
              <p className="text-label-sm text-foreground-secondary">
                Work From Home
              </p>
              <p className="text-heading-md text-foreground-primary">
                {leaveStats.wfhDays}
              </p>
            </div>
          </div>

          <div className="px-5 pt-2 border-b border-neutral-primary">
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
          </div>

          {activeTab === "leave" && (
            <div className="flex flex-wrap justify-end gap-2 border-b border-neutral-primary bg-surface-neutral-primary px-5 py-3">
              <Button size="sm" variant="secondary" onClick={() => setTermsOpen(true)}>
                <RiFileTextLine className="mr-2 size-3.5" />
                Read Terms &amp; Conditions
              </Button>
              <Button size="sm" onClick={handleAdd}>
                <RiAddLine className="mr-2 size-3.5" />
                Request Leave
              </Button>
            </div>
          )}

          <div className="p-5">
            {activeTab === "attendance" && (
              <AttendanceHistoryList
                logs={logs}
                onRequestDelete={(id) => {
                  setPendingDeleteId(id)
                  setDeleteConfirmOpen(true)
                }}
              />
            )}

            {activeTab === "leave" && (
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
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody>
            <p className="text-body-sm text-foreground-secondary">
              Apakah Anda yakin ingin mengajukan penghapusan data attendance ini?
            </p>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" className="w-full sm:w-fit">
                Cancel
              </Button>
            </DialogClose>
            <Button className="w-full sm:w-fit" onClick={confirmDelete}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Terms &amp; Conditions</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="max-h-[70vh] overflow-y-auto">
            <LeaveRules />
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" className="w-full sm:w-fit">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
