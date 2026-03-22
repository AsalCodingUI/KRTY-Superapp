"use client"

import { AdminAttendanceHistoryList } from "@/app/(main)/attendance/components/AdminAttendanceHistoryList"
import { createClient } from "@/shared/api/supabase/client"
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import { canManageByRole } from "@/shared/lib/roles"
import { Database } from "@/shared/types/database.types"
import {
  Button,
  ConfirmDialog,
  DatePicker,
  Dialog,
  DialogBody,
  DialogClose,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabNavigation,
  TabNavigationLink,
  Textarea,
  TextInput,
} from "@/shared/ui"
import { DataTable } from "@/shared/ui/data/DataTable"
import { RiCalendarCheckLine } from "@/shared/ui/lucide-icons"
import { format } from "date-fns"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  adminColumns,
  LeaveRequestWithProfile,
} from "./components/AdminColumns"
import { remainingLeaveColumns } from "./components/RemainingLeaveColumns"

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "avatar_url" | "job_title" | "leave_used" | "leave_balance"
>
type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]
type AttendanceLogWithProfile = AttendanceLog & {
  profiles: {
    full_name: string
    avatar_url: string | null
    job_title: string | null
  } | null
}

type ManualLeaveForm = {
  user_id: string
  leave_type: "Annual Leave" | "Sick Leave" | "WFH"
  start_date: string
  end_date: string
  status: "pending" | "approved" | "rejected"
  reason: string
  proof_url: string
  created_at: string
}

function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateOnly(value: string): Date | undefined {
  if (!value) return undefined
  const [y, m, d] = value.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

type PendingConfirm = {
  title: string
  description: string
  confirmText: string
  variant?: "destructive"
  onConfirm: () => Promise<void>
}

interface StakeholderLeavePageProps {
  requests: LeaveRequestWithProfile[]
  profiles: Profile[]
  attendanceLogs?: AttendanceLogWithProfile[]
  overviewStats?: {
    onLeaveToday: number
    pendingRequests: number
    totalApproved: number
    presentToday: number
    currentlyActive: number
  }
  page: number
  pageSize: number
  totalCount: number
  role?: string
}

export function StakeholderLeavePage({
  requests,
  profiles,
  attendanceLogs = [],
  overviewStats,
  page,
  pageSize,
  totalCount,
  role,
}: StakeholderLeavePageProps) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { activeTab, setActiveTab } = useTabRoute<
    "approval" | "remaining" | "attendance"
  >({
    basePath: "/leave",
    tabs: ["attendance", "approval", "remaining"],
    defaultTab: "attendance",
    preserveQuery: true,
    mode: "history",
  })
  const canManage = canManageByRole(role)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [manualSaving, setManualSaving] = useState(false)
  const [manualForm, setManualForm] = useState<ManualLeaveForm>({
    user_id: "",
    leave_type: "Annual Leave",
    start_date: "",
    end_date: "",
    status: "pending",
    reason: "",
    proof_url: "",
    created_at: new Date().toISOString(),
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  // --- Realtime: debounce refresh to avoid UI thrashing on burst updates ---
  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      refreshTimerRef.current = setTimeout(() => {
        router.refresh()
      }, 300)
    }

    const channel = supabase
      .channel("admin-realtime-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leave_requests" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leave_requests" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leave_requests" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "attendance_logs",
          filter: "notes=eq.DELETE_REQUESTED",
        },
        scheduleRefresh,
      )
      .subscribe()

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set("page", (newPage + 1).toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const pageCount = Math.ceil(totalCount / pageSize)

  const runWithConfirm = (payload: PendingConfirm) => {
    setPendingConfirm(payload)
  }

  const handleConfirm = async () => {
    if (!pendingConfirm) return
    setConfirmLoading(true)
    try {
      await pendingConfirm.onConfirm()
    } finally {
      setConfirmLoading(false)
      setPendingConfirm(null)
    }
  }

  const handleApprove = async (id: number) => {
    runWithConfirm({
      title: "Approve request",
      description: "This leave request will be marked as approved.",
      confirmText: "Approve",
      onConfirm: async () => {
        const { error } = await supabase
          .from("leave_requests")
          .update({ status: "approved" })
          .eq("id", id)
        if (error) {
          toast.error(error.message || "Failed to approve request")
          return
        }
        toast.success("Request approved")
        router.refresh()
      },
    })
  }

  const handleReject = async (id: number) => {
    runWithConfirm({
      title: "Reject request",
      description: "This leave request will be marked as rejected.",
      confirmText: "Reject",
      variant: "destructive",
      onConfirm: async () => {
        const { error } = await supabase
          .from("leave_requests")
          .update({ status: "rejected" })
          .eq("id", id)
        if (error) {
          toast.error(error.message || "Failed to reject request")
          return
        }
        toast.success("Request rejected")
        router.refresh()
      },
    })
  }

  const handleApproveAttendanceDelete = async (logId: string) => {
    runWithConfirm({
      title: "Approve delete attendance",
      description: "This attendance record will be permanently deleted.",
      confirmText: "Delete",
      variant: "destructive",
      onConfirm: async () => {
        const { error } = await supabase
          .from("attendance_logs")
          .delete()
          .eq("id", logId)

        if (error) {
          toast.error(error.message || "Failed to delete attendance")
          return
        }
        toast.success("Attendance deleted")
        router.refresh()
      },
    })
  }

  const openManualModal = () => {
    setManualForm({
      user_id: profiles[0]?.id || "",
      leave_type: "Annual Leave",
      start_date: "",
      end_date: "",
      status: "pending",
      reason: "",
      proof_url: "",
      created_at: new Date().toISOString(),
    })
    setManualModalOpen(true)
  }

  const handleManualSubmit = async () => {
    if (!manualForm.user_id) {
      toast.error("Please select employee")
      return
    }
    if (!manualForm.start_date || !manualForm.end_date) {
      toast.error("Please fill date range")
      return
    }
    if (manualForm.start_date > manualForm.end_date) {
      toast.error("End date must be after start date")
      return
    }
    if (!manualForm.created_at) {
      toast.error("Please fill submission date")
      return
    }

    setManualSaving(true)
    try {
      const createdAtIso = new Date(manualForm.created_at).toISOString()
      const { error } = await supabase.from("leave_requests").insert({
        user_id: manualForm.user_id,
        leave_type: manualForm.leave_type,
        start_date: manualForm.start_date,
        end_date: manualForm.end_date,
        status: manualForm.status,
        reason: manualForm.reason.trim() || null,
        proof_url: manualForm.proof_url.trim() || null,
        created_at: createdAtIso,
      })

      if (error) {
        toast.error(error.message || "Failed to add leave request manually")
        return
      }

      toast.success("Leave request added manually")
      setManualModalOpen(false)
      router.refresh()
    } finally {
      setManualSaving(false)
    }
  }

  const approvalContent = (
    <section>
      <DataTable
        data={requests}
        columns={adminColumns(handleApprove, handleReject, {
          canSelect: canManage,
          canManage,
        })}
        showExport={false}
        showViewOptions={false}
        showFilterbar={false}
        onCreate={undefined}
        manualPagination={true}
        pageCount={pageCount}
        pageIndex={page - 1}
        onPageChange={handlePageChange}
        enableSelection={canManage}
        onBulkApprove={
          canManage
            ? async (ids) => {
              runWithConfirm({
                title: "Approve leave requests",
                description: `Approve ${ids.length} leave request(s)?`,
                confirmText: "Approve",
                onConfirm: async () => {
                  const { error } = await supabase
                    .from("leave_requests")
                    .update({ status: "approved" })
                    .in("id", ids as number[])
                  if (error) {
                    toast.error(error.message || "Failed to approve requests")
                    return
                  }
                  toast.success("Leave request(s) approved")
                  router.refresh()
                },
              })
            }
            : undefined
        }
        onBulkReject={
          canManage
            ? async (ids) => {
              runWithConfirm({
                title: "Reject leave requests",
                description: `Reject ${ids.length} leave request(s)?`,
                confirmText: "Reject",
                variant: "destructive",
                onConfirm: async () => {
                  const { error } = await supabase
                    .from("leave_requests")
                    .update({ status: "rejected" })
                    .in("id", ids as number[])
                  if (error) {
                    toast.error(error.message || "Failed to reject requests")
                    return
                  }
                  toast.success("Leave request(s) rejected")
                  router.refresh()
                },
              })
            }
            : undefined
        }
        onDelete={
          canManage
            ? async (ids) => {
              runWithConfirm({
                title: "Delete leave requests",
                description: `Delete ${ids.length} leave request(s)? This cannot be undone.`,
                confirmText: "Delete",
                variant: "destructive",
                onConfirm: async () => {
                  const { error } = await supabase
                    .from("leave_requests")
                    .delete()
                    .in("id", ids as number[])
                  if (error) {
                    toast.error(error.message || "Failed to delete requests")
                    return
                  }
                  toast.success("Leave request(s) deleted")
                  router.refresh()
                },
              })
            }
            : undefined
        }
        showTableWrapper={false}
      />
    </section>
  )

  const remainingContent = <RemainingLeaveView data={profiles} />

  return (
    <>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 rounded-xxl px-5 pt-4 pb-3">
          <RiCalendarCheckLine className="size-4 text-foreground-secondary" />
          <p className="text-label-md text-foreground-primary">
            Leave & Attendance Center
          </p>
        </div>

        <AttendanceOverviewPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          attendanceLogs={attendanceLogs}
          leaveRequests={requests}
          approvalContent={approvalContent}
          remainingContent={remainingContent}
          onApproveAttendanceDelete={handleApproveAttendanceDelete}
          onAddManualLeave={openManualModal}
          overviewStats={overviewStats}
          isClient={isClient}
        />
      </div>

      <ConfirmDialog
        open={Boolean(pendingConfirm)}
        onOpenChange={(open) => {
          if (!open) setPendingConfirm(null)
        }}
        onConfirm={handleConfirm}
        title={pendingConfirm?.title || "Confirm action"}
        description={pendingConfirm?.description || ""}
        confirmText={pendingConfirm?.confirmText || "Confirm"}
        variant={pendingConfirm?.variant}
        loading={confirmLoading}
      />

      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Leave Manually</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <Label htmlFor="manual-user">Employee</Label>
              <Select
                value={manualForm.user_id}
                onValueChange={(value) =>
                  setManualForm((prev) => ({ ...prev, user_id: value }))
                }
              >
                <SelectTrigger id="manual-user" className="mt-2">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profileItem) => (
                    <SelectItem key={profileItem.id} value={profileItem.id}>
                      {profileItem.full_name || profileItem.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label>Start Date</Label>
                <DatePicker
                  className="mt-2 w-full"
                  value={parseDateOnly(manualForm.start_date)}
                  onChange={(date) =>
                    setManualForm((prev) => ({
                      ...prev,
                      start_date: date ? format(date, "yyyy-MM-dd") : "",
                    }))
                  }
                  placeholder="Select start date"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <DatePicker
                  className="mt-2 w-full"
                  value={parseDateOnly(manualForm.end_date)}
                  onChange={(date) =>
                    setManualForm((prev) => ({
                      ...prev,
                      end_date: date ? format(date, "yyyy-MM-dd") : "",
                    }))
                  }
                  placeholder="Select end date"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="manual-leave-type">Leave Type</Label>
                <Select
                  value={manualForm.leave_type}
                  onValueChange={(value) =>
                    setManualForm((prev) => ({
                      ...prev,
                      leave_type: value as ManualLeaveForm["leave_type"],
                    }))
                  }
                >
                  <SelectTrigger id="manual-leave-type" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                    <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                    <SelectItem value="WFH">WFH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manual-status">Status</Label>
                <Select
                  value={manualForm.status}
                  onValueChange={(value) =>
                    setManualForm((prev) => ({
                      ...prev,
                      status: value as ManualLeaveForm["status"],
                    }))
                  }
                >
                  <SelectTrigger id="manual-status" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Submission Date</Label>
              <DatePicker
                className="mt-2 w-full"
                showTimePicker
                value={
                  manualForm.created_at
                    ? new Date(manualForm.created_at)
                    : undefined
                }
                onChange={(date) =>
                  setManualForm((prev) => ({
                    ...prev,
                    created_at: date ? date.toISOString() : "",
                  }))
                }
                placeholder="Select submission date"
              />
            </div>

            <div>
              <Label htmlFor="manual-reason">Reason</Label>
              <Textarea
                id="manual-reason"
                className="mt-2"
                placeholder="Optional reason"
                value={manualForm.reason}
                onChange={(e) =>
                  setManualForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="manual-proof-url">Proof URL</Label>
              <TextInput
                id="manual-proof-url"
                className="mt-2"
                placeholder="https://..."
                value={manualForm.proof_url}
                onChange={(e) =>
                  setManualForm((prev) => ({
                    ...prev,
                    proof_url: e.target.value,
                  }))
                }
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleManualSubmit} isLoading={manualSaving}>
              Save Manual Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function AttendanceOverviewPanel({
  activeTab,
  onTabChange,
  attendanceLogs,
  leaveRequests,
  approvalContent,
  remainingContent,
  onApproveAttendanceDelete,
  onAddManualLeave,
  overviewStats,
  isClient,
}: {
  activeTab: "approval" | "remaining" | "attendance"
  onTabChange: (tab: "approval" | "remaining" | "attendance") => void
  attendanceLogs: AttendanceLogWithProfile[]
  leaveRequests: LeaveRequestWithProfile[]
  approvalContent: React.ReactNode
  remainingContent: React.ReactNode
  onApproveAttendanceDelete: (logId: string) => void
  onAddManualLeave: () => void
  isClient: boolean
  overviewStats?: {
    onLeaveToday: number
    pendingRequests: number
    totalApproved: number
    presentToday: number
    currentlyActive: number
  }
}) {
  const { isMounted } = useMountedTabs(activeTab)
  const today = getLocalDateString()

  const onLeaveToday = leaveRequests.filter(
    (req) =>
      req.status === "approved" &&
      req.start_date <= today &&
      req.end_date >= today,
  ).length

  const pendingRequests = leaveRequests.filter(
    (req) => req.status === "pending",
  ).length

  const totalApproved = leaveRequests.filter(
    (req) => req.status === "approved",
  ).length

  const presentToday = attendanceLogs.filter(
    (log) => log.date === today,
  ).length

  const currentlyActive = attendanceLogs.filter(
    (log) => log.date === today && !log.clock_out,
  ).length

  const stats = [
    { label: "On Leave Today", value: overviewStats?.onLeaveToday ?? onLeaveToday },
    { label: "Pending Requests", value: overviewStats?.pendingRequests ?? pendingRequests },
    { label: "Total Approved", value: overviewStats?.totalApproved ?? totalApproved },
    { label: "Present Today", value: overviewStats?.presentToday ?? presentToday },
    { label: "Currently Active", value: overviewStats?.currentlyActive ?? currentlyActive },
  ]

  return (
    <div className="flex flex-col rounded-xxl bg-surface-neutral-primary">
      <div className="grid grid-cols-2 gap-3 px-5 py-2 lg:grid-cols-5">
        {stats.map((item) => (
          <div
            key={item.label}
            className="border-neutral-primary bg-surface-neutral-primary flex flex-col gap-1 rounded-lg border px-4 py-3"
          >
            <p className="text-label-sm text-foreground-secondary">
              {item.label}
            </p>
            <p className="text-heading-md text-foreground-primary">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="px-5 pt-2 border-b border-neutral-primary space-y-3">
        <div className="xl:hidden">
          {isClient ? (
            <Select
              value={activeTab}
              onValueChange={(value) =>
                onTabChange(value as "attendance" | "approval" | "remaining")
              }
            >
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance">Attendance History</SelectItem>
                <SelectItem value="approval">Approvals Leave</SelectItem>
                <SelectItem value="remaining">Remaining Leave</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="border-neutral-primary h-9 w-full rounded-md border bg-surface-neutral-primary" />
          )}
        </div>
        <div className="hidden xl:flex items-start justify-between gap-4">
          <TabNavigation className="border-b-0">
            <TabNavigationLink
              active={activeTab === "attendance"}
              onClick={() => onTabChange("attendance")}
              showLeadingIcon={false}
            >
              Attendance History
            </TabNavigationLink>
            <TabNavigationLink
              active={activeTab === "approval"}
              onClick={() => onTabChange("approval")}
              showLeadingIcon={false}
            >
              Approvals Leave
            </TabNavigationLink>
            <TabNavigationLink
              active={activeTab === "remaining"}
              onClick={() => onTabChange("remaining")}
              showLeadingIcon={false}
            >
              Remaining Leave
            </TabNavigationLink>
          </TabNavigation>
          {activeTab === "approval" && (
            <Button size="sm" onClick={onAddManualLeave}>
              Added Manually
            </Button>
          )}
        </div>
      </div>

      <div className="p-5">
        {activeTab === "approval" && (
          <div className="block space-y-5">{approvalContent}</div>
        )}
        {isMounted("remaining") && (
          <div className={activeTab === "remaining" ? "block space-y-5" : "hidden space-y-5"}>
            {remainingContent}
          </div>
        )}
        {isMounted("attendance") && (
          <div className={activeTab === "attendance" ? "block space-y-5" : "hidden space-y-5"}>
            <AdminAttendanceHistoryList
              logs={attendanceLogs}
              onApproveDelete={onApproveAttendanceDelete}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// --- SUB-COMPONENT (Sekarang lebih sederhana & cepat) ---
function RemainingLeaveView({
  data,
}: {
  data: Profile[]
}) {
  return (
    <section>
      <DataTable
        data={data}
        columns={remainingLeaveColumns}
        showExport={false}
        showViewOptions={false}
        showFilterbar={false}
        actionLabel=""
        enableSelection={false}
        onDelete={undefined}
        showTableWrapper={false}
      />
    </section>
  )
}
