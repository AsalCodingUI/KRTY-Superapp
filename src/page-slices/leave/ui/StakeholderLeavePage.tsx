"use client"

import { RiAddLine } from "@/shared/ui/lucide-icons"
import { cn } from "@/lib/utils"
import { TAB_ENTER, useTabSwitched } from "@/shared/hooks/useTabSwitched"
import { RollingValue } from "@/components/rolling-value"
import { PageHeader } from "@/components/page-header"
import { AdminAttendanceHistoryList } from "@/app/(main)/attendance/components/AdminAttendanceHistoryList"
import { createClient } from "@/shared/api/supabase/client"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { useMountedTabs } from "@/shared/hooks/useMountedTabs"
import { useTabRoute } from "@/shared/hooks/useTabRoute"
import {
  ATTENDANCE_NOTE_TAGS,
  mergeAttendanceNote,
  removeAttendanceNote,
} from "@/shared/lib/attendance"
import {
  getAttendanceLogLocalDate,
  getLocalDateString,
} from "@/shared/lib/date"
import { calculateBusinessDays } from "@/shared/lib/date"
import { canManageByRole } from "@/shared/lib/roles"
import { Database } from "@/shared/types/database.types"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DataTable } from "@/components/data-table"
import { DatePicker } from "@/components/date-picker"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import dynamic from "next/dynamic"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { adminColumns } from "./components/AdminColumns"
import { type LeaveRequestWithProfile } from "./components/AdminLeaveList"
import { RemainingLeaveList } from "./components/RemainingLeaveList"

// Edit dialog only loads once an admin opens a session to edit.
const AdminAttendanceEditDialog = dynamic(
  () =>
    import("@/app/(main)/attendance/components/AdminAttendanceEditDialog").then(
      (m) => m.AdminAttendanceEditDialog,
    ),
  { loading: () => null },
)

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "full_name"
  | "avatar_url"
  | "job_title"
  | "leave_used"
  | "leave_balance"
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
  const t = useT("leave")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { activeTab, setActiveTab } = useTabRoute<
    "approval" | "remaining" | "attendance"
  >({
    basePath: "/leave",
    // Approvals first: it's the tab stakeholders act on.
    tabs: ["approval", "attendance", "remaining"],
    defaultTab: "approval",
    preserveQuery: true,
    mode: "history",
  })
  const canManage = canManageByRole(role)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(
    null,
  )
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [manualModalOpen, setManualModalOpen] = useState(false)
  const [rejectIds, setRejectIds] = useState<number[] | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejecting, setRejecting] = useState(false)
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null)
  const [manualSaving, setManualSaving] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [manualForm, setManualForm] = useState<ManualLeaveForm>({
    user_id: "",
    leave_type: "Annual Leave",
    start_date: "",
    end_date: "",
    status: "pending",
    reason: "",
    proof_url: "",
    created_at: "",
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

  const handleApprove = useCallback(
    async (id: number) => {
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "approved", review_note: null })
        .eq("id", id)
      if (error) {
        toast.error(error.message || t("toastApproveFailed"))
        return
      }
      toast.success(t("toastApproved"))
      router.refresh()
    },
    [supabase, router, t],
  )

  const handleReject = useCallback(async (id: number) => {
    setRejectNote("")
    setRejectIds([id])
  }, [])

  const approvalColumns = useMemo(
    () =>
      adminColumns(handleApprove, handleReject, {
        canSelect: canManage,
        canManage,
        t,
        dateLocale,
      }),
    [handleApprove, handleReject, canManage, t, dateLocale],
  )

  const confirmReject = async () => {
    if (!rejectIds) return
    setRejecting(true)
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: "rejected", review_note: rejectNote.trim() || null })
      .in("id", rejectIds)
    setRejecting(false)
    if (error) {
      toast.error(error.message || t("toastRejectFailed"))
      return
    }
    toast.success(
      rejectIds.length > 1
        ? t("toastRejectedOther", { n: rejectIds.length })
        : t("toastRejectedOne"),
    )
    setRejectIds(null)
    router.refresh()
  }

  /** Review an employee's delete request: delete the record or decline. */
  const handleApproveAttendanceDelete = async (logId: string) => {
    setDeleteReviewId(logId)
  }

  const declineAttendanceDelete = async (logId: string) => {
    const log = attendanceLogs.find((l) => l.id === logId)
    const { error } = await supabase
      .from("attendance_logs")
      .update({
        notes: removeAttendanceNote(
          log?.notes,
          ATTENDANCE_NOTE_TAGS.deleteRequested,
        ),
      })
      .eq("id", logId)
    if (error) {
      toast.error(error.message || t("toastDeclineFailed"))
      return
    }
    toast.success(t("toastDeleteRequestDeclined"))
    setDeleteReviewId(null)
    router.refresh()
  }

  const deleteAttendanceLog = async (logId: string) => {
    runWithConfirm({
      title: t("confirmDeleteLogTitle"),
      description: t("confirmDeleteLogDesc"),
      confirmText: tc("delete"),
      variant: "destructive",
      onConfirm: async () => {
        const { error } = await supabase
          .from("attendance_logs")
          .delete()
          .eq("id", logId)

        if (error) {
          toast.error(error.message || t("toastDeleteLogFailed"))
          return
        }
        toast.success(t("toastLogDeleted"))
        setDeleteReviewId(null)
        router.refresh()
      },
    })
  }

  const handleCloseAttendanceSession = async (logId: string) => {
    runWithConfirm({
      title: t("closeSessionTitle"),
      description: t("closeSessionDesc"),
      confirmText: t("closeSession"),
      onConfirm: async () => {
        const now = new Date().toISOString()
        const currentLog = attendanceLogs.find((log) => log.id === logId)
        const { error } = await supabase
          .from("attendance_logs")
          .update({
            clock_out: now,
            is_break: false,
            break_start: null,
            notes: mergeAttendanceNote(
              currentLog?.notes,
              ATTENDANCE_NOTE_TAGS.adminClosedSession,
            ),
          })
          .eq("id", logId)

        if (error) {
          toast.error(error.message || t("toastCloseSessionFailed"))
          return
        }
        toast.success(t("toastSessionClosed"))
        router.refresh()
      },
    })
  }

  const handleEditAttendanceSession = (logId: string) => {
    setEditingLogId(logId)
  }

  const editingLog =
    attendanceLogs.find((log) => log.id === editingLogId) ?? null
  const [editDialogMounted, setEditDialogMounted] = useState(false)
  if (editingLog && !editDialogMounted) setEditDialogMounted(true)

  const handleUpdateAttendanceSession = async (payload: {
    date: string
    clockIn: string
    clockOut: string
    status: string
  }) => {
    if (!editingLog) return

    setEditLoading(true)
    try {
      const { error } = await supabase
        .from("attendance_logs")
        .update({
          date: payload.date,
          clock_in: payload.clockIn,
          clock_out: payload.clockOut,
          status: payload.status,
          is_break: false,
          break_start: null,
          notes: mergeAttendanceNote(
            editingLog.notes,
            ATTENDANCE_NOTE_TAGS.adminEditedSession,
          ),
        })
        .eq("id", editingLog.id)

      if (error) {
        toast.error(error.message || t("toastUpdateAttendanceFailed"))
        return
      }

      toast.success(t("toastAttendanceUpdated"))
      setEditingLogId(null)
      router.refresh()
    } finally {
      setEditLoading(false)
    }
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
      toast.error(t("pickEmployee"))
      return
    }
    if (!manualForm.start_date || !manualForm.end_date) {
      toast.error(t("errFillDates"))
      return
    }
    if (manualForm.start_date > manualForm.end_date) {
      toast.error(t("errEndBeforeStart"))
      return
    }
    if (
      calculateBusinessDays(
        new Date(manualForm.start_date),
        new Date(manualForm.end_date),
      ) <= 0
    ) {
      toast.error(t("errNoBusinessDays"))
      return
    }
    if (!manualForm.created_at) {
      toast.error(t("errFillSubmittedDate"))
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
        toast.error(error.message || t("toastManualFailed"))
        return
      }

      toast.success(t("toastManualAdded"))
      setManualModalOpen(false)
      router.refresh()
    } finally {
      setManualSaving(false)
    }
  }

  // Persetujuan is always a table; Saldo Cuti is always a flat list.
  const approvalContent = (
    <DataTable
      data={requests}
      columns={approvalColumns}
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
                title: t("confirmApproveTitle"),
                description: t(
                  ids.length === 1
                    ? "confirmApproveDescOne"
                    : "confirmApproveDescOther",
                  { n: ids.length },
                ),
                confirmText: t("approve"),
                onConfirm: async () => {
                  const { error } = await supabase
                    .from("leave_requests")
                    .update({ status: "approved" })
                    .in("id", ids as number[])
                  if (error) {
                    toast.error(error.message || t("toastApproveFailed"))
                    return
                  }
                  toast.success(t("toastApproved"))
                  router.refresh()
                },
              })
            }
          : undefined
      }
      onBulkReject={
        canManage
          ? async (ids) => {
              setRejectNote("")
              setRejectIds(ids as number[])
            }
          : undefined
      }
      onDelete={
        canManage
          ? async (ids) => {
              runWithConfirm({
                title: t("confirmDeleteTitle"),
                description: t(
                  ids.length === 1
                    ? "confirmDeleteDescOne"
                    : "confirmDeleteDescOther",
                  { n: ids.length },
                ),
                confirmText: tc("delete"),
                variant: "destructive",
                onConfirm: async () => {
                  const { error } = await supabase
                    .from("leave_requests")
                    .delete()
                    .in("id", ids as number[])
                  if (error) {
                    toast.error(error.message || t("toastDeleteFailed"))
                    return
                  }
                  toast.success(t("toastDeleted"))
                  router.refresh()
                },
              })
            }
          : undefined
      }
      showTableWrapper={false}
    />
  )

  const remainingContent = <RemainingLeaveList data={profiles} />

  return (
    <>
      <div className="flex flex-col">
        <AttendanceOverviewPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          attendanceLogs={attendanceLogs}
          leaveRequests={requests}
          approvalContent={approvalContent}
          remainingContent={remainingContent}
          onApproveAttendanceDelete={handleApproveAttendanceDelete}
          onCloseAttendanceSession={handleCloseAttendanceSession}
          onEditAttendanceSession={handleEditAttendanceSession}
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
        title={pendingConfirm?.title || t("confirmDefaultTitle")}
        description={pendingConfirm?.description || ""}
        confirmText={pendingConfirm?.confirmText || t("confirmDefault")}
        variant={pendingConfirm?.variant}
        loading={confirmLoading}
      />

      <Dialog
        open={rejectIds !== null}
        onOpenChange={(open) => !open && setRejectIds(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rejectIds && rejectIds.length > 1
                ? t("rejectTitleOther", { n: rejectIds.length })
                : t("rejectTitleOne")}
            </DialogTitle>
            <DialogDescription>{t("rejectDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-note">{t("reasonOptional")}</Label>
            <Textarea
              id="reject-note"
              rows={3}
              placeholder={t("rejectPlaceholder")}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {tc("cancel")}
            </DialogClose>
            <Button
              variant="destructive"
              disabled={rejecting}
              onClick={confirmReject}
            >
              {rejecting && <Spinner data-icon="inline-start" />}
              {t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteReviewId !== null}
        onOpenChange={(open) => !open && setDeleteReviewId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteReviewTitle")}</DialogTitle>
            <DialogDescription>{t("deleteReviewDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                deleteReviewId && declineAttendanceDelete(deleteReviewId)
              }
            >
              {t("declineRequest")}
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteReviewId && deleteAttendanceLog(deleteReviewId)
              }
            >
              {t("deleteData")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editDialogMounted && (
        <AdminAttendanceEditDialog
          log={editingLog}
          open={Boolean(editingLog)}
          loading={editLoading}
          onOpenChange={(open) => {
            if (!open) setEditingLogId(null)
          }}
          onSubmit={handleUpdateAttendanceSession}
        />
      )}

      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="sm:max-w-[35rem]">
          <DialogHeader>
            <DialogTitle>{t("manualTitle")}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto">
            <div>
              <Label htmlFor="manual-user">{t("colEmployee")}</Label>
              <Select
                value={manualForm.user_id}
                onValueChange={(value) =>
                  value !== null &&
                  setManualForm((prev) => ({ ...prev, user_id: value }))
                }
              >
                <SelectTrigger id="manual-user" className="mt-2 w-full">
                  <SelectValue placeholder={t("pickEmployee")} />
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
                <Label>{t("startDate")}</Label>
                <DatePicker
                  className="mt-2 w-full"
                  value={parseDateOnly(manualForm.start_date)}
                  onChange={(date) =>
                    setManualForm((prev) => ({
                      ...prev,
                      start_date: date ? format(date, "yyyy-MM-dd") : "",
                    }))
                  }
                  placeholder={t("selectStartDate")}
                />
              </div>
              <div>
                <Label>{t("endDate")}</Label>
                <DatePicker
                  className="mt-2 w-full"
                  value={parseDateOnly(manualForm.end_date)}
                  onChange={(date) =>
                    setManualForm((prev) => ({
                      ...prev,
                      end_date: date ? format(date, "yyyy-MM-dd") : "",
                    }))
                  }
                  placeholder={t("selectEndDate")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="manual-leave-type">{t("colType")}</Label>
                <Select
                  value={manualForm.leave_type}
                  onValueChange={(value) =>
                    setManualForm((prev) => ({
                      ...prev,
                      leave_type: value as ManualLeaveForm["leave_type"],
                    }))
                  }
                >
                  <SelectTrigger id="manual-leave-type" className="mt-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual Leave">
                      {t("typeAnnual")}
                    </SelectItem>
                    <SelectItem value="Sick Leave">{t("typeSick")}</SelectItem>
                    <SelectItem value="WFH">{t("typeWfh")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manual-status">{t("colStatus")}</Label>
                <Select
                  value={manualForm.status}
                  onValueChange={(value) =>
                    setManualForm((prev) => ({
                      ...prev,
                      status: value as ManualLeaveForm["status"],
                    }))
                  }
                >
                  <SelectTrigger id="manual-status" className="mt-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      {t("statusPending")}
                    </SelectItem>
                    <SelectItem value="approved">
                      {t("statusApproved")}
                    </SelectItem>
                    <SelectItem value="rejected">
                      {t("statusRejected")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{t("submittedDate")}</Label>
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
                placeholder={t("selectSubmittedDate")}
              />
            </div>

            <div>
              <Label htmlFor="manual-reason">{t("colReason")}</Label>
              <Textarea
                id="manual-reason"
                className="mt-2"
                placeholder={t("reasonOptional")}
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
              <Label htmlFor="manual-proof-url">{t("proofLink")}</Label>
              <Input
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
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {tc("cancel")}
            </DialogClose>
            <Button disabled={manualSaving} onClick={handleManualSubmit}>
              {manualSaving && <Spinner data-icon="inline-start" />}
              {tc("save")}
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
  onCloseAttendanceSession,
  onEditAttendanceSession,
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
  onCloseAttendanceSession: (logId: string) => void
  onEditAttendanceSession: (logId: string) => void
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
  const t = useT("leave")
  const tabSwitched = useTabSwitched(activeTab)
  const { isMounted } = useMountedTabs(activeTab)
  const today = getLocalDateString()

  // Fallback counts, only used when the server didn't send overviewStats.
  const {
    onLeaveToday,
    pendingRequests,
    totalApproved,
    presentToday,
    currentlyActive,
  } = useMemo(() => {
    let onLeaveToday = 0
    let pendingRequests = 0
    let totalApproved = 0
    for (const req of leaveRequests) {
      if (req.status === "pending") pendingRequests++
      if (req.status === "approved") {
        totalApproved++
        if (req.start_date <= today && req.end_date >= today) onLeaveToday++
      }
    }
    let presentToday = 0
    let currentlyActive = 0
    for (const log of attendanceLogs) {
      if (getAttendanceLogLocalDate(log) === today) {
        presentToday++
        if (!log.clock_out) currentlyActive++
      }
    }
    return {
      onLeaveToday,
      pendingRequests,
      totalApproved,
      presentToday,
      currentlyActive,
    }
  }, [leaveRequests, attendanceLogs, today])

  const stats = [
    {
      label: t("statOnLeaveToday"),
      value: overviewStats?.onLeaveToday ?? onLeaveToday,
    },
    {
      label: t("statPending"),
      value: overviewStats?.pendingRequests ?? pendingRequests,
    },
    {
      label: t("statApproved"),
      value: overviewStats?.totalApproved ?? totalApproved,
    },
    {
      label: t("statPresentToday"),
      value: overviewStats?.presentToday ?? presentToday,
    },
    {
      label: t("statWorkingNow"),
      value: overviewStats?.currentlyActive ?? currentlyActive,
    },
  ]

  return (
    <div className="flex flex-col">
      {/* Mercury order: title + actions, tabs, a stats band, then the list. */}
      <PageHeader
        className="pt-6 pb-4"
        title={t("pageTitle")}
        actions={
          activeTab === "approval" ? (
            <Button onClick={onAddManualLeave}>
              <RiAddLine data-icon="inline-start" />
              {t("addManual")}
            </Button>
          ) : null
        }
      />

      <div className="bleed gutter-x border-border border-b">
        <div className="pb-3 xl:hidden">
          {isClient ? (
            <Select
              value={activeTab}
              onValueChange={(value) =>
                onTabChange(value as "attendance" | "approval" | "remaining")
              }
            >
              <SelectTrigger id="leave-tab-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approval">{t("tabApproval")}</SelectItem>
                <SelectItem value="attendance">{t("tabAttendance")}</SelectItem>
                <SelectItem value="remaining">{t("tabBalance")}</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="bg-foreground/[0.03] h-9 w-full rounded-md" />
          )}
        </div>
        <div className="hidden xl:block">
          <TabNavigation className="border-b-0">
            <TabNavigationLink
              active={activeTab === "approval"}
              onClick={() => onTabChange("approval")}
              showLeadingIcon={false}
            >
              {t("tabApproval")}
            </TabNavigationLink>
            <TabNavigationLink
              active={activeTab === "attendance"}
              onClick={() => onTabChange("attendance")}
              showLeadingIcon={false}
            >
              {t("tabAttendance")}
            </TabNavigationLink>
            <TabNavigationLink
              active={activeTab === "remaining"}
              onClick={() => onTabChange("remaining")}
              showLeadingIcon={false}
            >
              {t("tabBalance")}
            </TabNavigationLink>
          </TabNavigation>
        </div>
      </div>

      {/* Full-bleed band between the tabs and the list. */}
      <div className="stat-strip bleed gutter-x border-border border-b py-4">
        {stats.map((item) => (
          <div key={item.label} className="stat-tile">
            <p className="text-muted-foreground text-sm">{item.label}</p>
            <p className="text-foreground text-xl font-normal tracking-tight tabular-nums">
              <RollingValue>{item.value}</RollingValue>
            </p>
          </div>
        ))}
      </div>

      <div className="pb-4">
        {activeTab === "approval" && (
          <div className={cn("block space-y-5", tabSwitched && TAB_ENTER)}>
            {approvalContent}
          </div>
        )}
        {isMounted("remaining") && (
          <div
            className={
              activeTab === "remaining"
                ? cn("block space-y-5", tabSwitched && TAB_ENTER)
                : "hidden space-y-5"
            }
          >
            {remainingContent}
          </div>
        )}
        {isMounted("attendance") && (
          <div
            className={
              activeTab === "attendance"
                ? cn("block", tabSwitched && TAB_ENTER)
                : "hidden"
            }
          >
            <AdminAttendanceHistoryList
              logs={attendanceLogs}
              onApproveDelete={onApproveAttendanceDelete}
              onCloseSession={onCloseAttendanceSession}
              onEditSession={onEditAttendanceSession}
            />
          </div>
        )}
      </div>
    </div>
  )
}
