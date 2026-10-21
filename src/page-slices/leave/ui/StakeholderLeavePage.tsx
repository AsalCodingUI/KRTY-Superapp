"use client"

import { AdminAttendanceEditDialog } from "@/app/(main)/attendance/components/AdminAttendanceEditDialog"
import { AdminAttendanceHistoryList } from "@/app/(main)/attendance/components/AdminAttendanceHistoryList"
import { createClient } from "@/shared/api/supabase/client"
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

  const handleApprove = async (id: number) => {
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: "approved", review_note: null })
      .eq("id", id)
    if (error) {
      toast.error(error.message || "Gagal menyetujui pengajuan")
      return
    }
    toast.success("Pengajuan disetujui")
    router.refresh()
  }

  const handleReject = async (id: number) => {
    setRejectNote("")
    setRejectIds([id])
  }

  const confirmReject = async () => {
    if (!rejectIds) return
    setRejecting(true)
    const { error } = await supabase
      .from("leave_requests")
      .update({ status: "rejected", review_note: rejectNote.trim() || null })
      .in("id", rejectIds)
    setRejecting(false)
    if (error) {
      toast.error(error.message || "Gagal menolak pengajuan")
      return
    }
    toast.success(
      rejectIds.length > 1
        ? `${rejectIds.length} pengajuan ditolak`
        : "Pengajuan ditolak",
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
      toast.error(error.message || "Gagal menolak permintaan")
      return
    }
    toast.success("Permintaan hapus ditolak")
    setDeleteReviewId(null)
    router.refresh()
  }

  const deleteAttendanceLog = async (logId: string) => {
    runWithConfirm({
      title: "Hapus data kehadiran?",
      description: "Data ini akan dihapus permanen.",
      confirmText: "Hapus",
      variant: "destructive",
      onConfirm: async () => {
        const { error } = await supabase
          .from("attendance_logs")
          .delete()
          .eq("id", logId)

        if (error) {
          toast.error(error.message || "Gagal menghapus data kehadiran")
          return
        }
        toast.success("Data kehadiran dihapus")
        setDeleteReviewId(null)
        router.refresh()
      },
    })
  }

  const handleCloseAttendanceSession = async (logId: string) => {
    runWithConfirm({
      title: "Tutup sesi attendance",
      description:
        "Sesi attendance yang masih aktif akan ditutup dengan waktu saat ini.",
      confirmText: "Tutup sesi",
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
          toast.error(error.message || "Gagal menutup sesi")
          return
        }
        toast.success("Sesi ditutup")
        router.refresh()
      },
    })
  }

  const handleEditAttendanceSession = (logId: string) => {
    setEditingLogId(logId)
  }

  const editingLog =
    attendanceLogs.find((log) => log.id === editingLogId) ?? null

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
        toast.error(error.message || "Gagal memperbarui kehadiran")
        return
      }

      toast.success("Kehadiran diperbarui")
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
      toast.error("Pilih karyawan")
      return
    }
    if (!manualForm.start_date || !manualForm.end_date) {
      toast.error("Isi tanggal mulai dan selesai")
      return
    }
    if (manualForm.start_date > manualForm.end_date) {
      toast.error("Tanggal selesai harus setelah tanggal mulai")
      return
    }
    if (
      calculateBusinessDays(
        new Date(manualForm.start_date),
        new Date(manualForm.end_date),
      ) <= 0
    ) {
      toast.error("Rentang tanggal tidak berisi hari kerja")
      return
    }
    if (!manualForm.created_at) {
      toast.error("Isi tanggal pengajuan")
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
        toast.error(error.message || "Gagal menambah cuti manual")
        return
      }

      toast.success("Cuti manual ditambahkan")
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
                  title: "Setujui pengajuan?",
                  description: `${ids.length} pengajuan akan disetujui.`,
                  confirmText: "Setujui",
                  onConfirm: async () => {
                    const { error } = await supabase
                      .from("leave_requests")
                      .update({ status: "approved" })
                      .in("id", ids as number[])
                    if (error) {
                      toast.error(error.message || "Gagal menyetujui pengajuan")
                      return
                    }
                    toast.success("Pengajuan disetujui")
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
                  title: "Hapus pengajuan?",
                  description: `${ids.length} pengajuan akan dihapus permanen.`,
                  confirmText: "Delete",
                  variant: "destructive",
                  onConfirm: async () => {
                    const { error } = await supabase
                      .from("leave_requests")
                      .delete()
                      .in("id", ids as number[])
                    if (error) {
                      toast.error(error.message || "Gagal menghapus pengajuan")
                      return
                    }
                    toast.success("Pengajuan dihapus")
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
        title={pendingConfirm?.title || "Confirm action"}
        description={pendingConfirm?.description || ""}
        confirmText={pendingConfirm?.confirmText || "Confirm"}
        variant={pendingConfirm?.variant}
        loading={confirmLoading}
      />

      <Dialog
        open={rejectIds !== null}
        onOpenChange={(open) => !open && setRejectIds(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {rejectIds && rejectIds.length > 1
                ? `Tolak ${rejectIds.length} pengajuan?`
                : "Tolak pengajuan?"}
            </DialogTitle>
            <DialogDescription>
              Karyawan akan menerima notifikasi beserta catatan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-note">Alasan (opsional)</Label>
            <Textarea
              id="reject-note"
              rows={3}
              placeholder="Mis. bentrok dengan deadline project"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Batal
            </DialogClose>
            <Button
              variant="destructive"
              disabled={rejecting}
              onClick={confirmReject}
            >
              {rejecting && <Spinner data-icon="inline-start" />}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteReviewId !== null}
        onOpenChange={(open) => !open && setDeleteReviewId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Permintaan hapus data kehadiran</DialogTitle>
            <DialogDescription>
              Karyawan meminta data ini dihapus. Hapus datanya, atau tolak
              permintaannya agar data tetap tersimpan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                deleteReviewId && declineAttendanceDelete(deleteReviewId)
              }
            >
              Tolak permintaan
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteReviewId && deleteAttendanceLog(deleteReviewId)
              }
            >
              Hapus data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminAttendanceEditDialog
        log={editingLog}
        open={Boolean(editingLog)}
        loading={editLoading}
        onOpenChange={(open) => {
          if (!open) setEditingLogId(null)
        }}
        onSubmit={handleUpdateAttendanceSession}
      />

      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah cuti manual</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 space-y-4 overflow-y-auto">
            <div>
              <Label htmlFor="manual-user">Karyawan</Label>
              <Select
                value={manualForm.user_id}
                onValueChange={(value) =>
                  value !== null &&
                  setManualForm((prev) => ({ ...prev, user_id: value }))
                }
              >
                <SelectTrigger id="manual-user" className="mt-2 w-full">
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
                <Label>Tanggal mulai</Label>
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
                <Label>Tanggal selesai</Label>
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
                <Label htmlFor="manual-leave-type">Jenis</Label>
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
                    <SelectItem value="Annual Leave">Cuti Tahunan</SelectItem>
                    <SelectItem value="Sick Leave">Sakit</SelectItem>
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
                  <SelectTrigger id="manual-status" className="mt-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Menunggu</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tanggal pengajuan</Label>
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
              <Label htmlFor="manual-reason">Alasan</Label>
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
              <Label htmlFor="manual-proof-url">Link bukti</Label>
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
            <DialogClose render={<Button variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button disabled={manualSaving} onClick={handleManualSubmit}>
              {manualSaving && <Spinner data-icon="inline-start" />}
              Simpan
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
    (log) => getAttendanceLogLocalDate(log) === today,
  ).length

  const currentlyActive = attendanceLogs.filter(
    (log) => getAttendanceLogLocalDate(log) === today && !log.clock_out,
  ).length

  const stats = [
    {
      label: "Cuti hari ini",
      value: overviewStats?.onLeaveToday ?? onLeaveToday,
    },
    {
      label: "Menunggu persetujuan",
      value: overviewStats?.pendingRequests ?? pendingRequests,
    },
    {
      label: "Disetujui",
      value: overviewStats?.totalApproved ?? totalApproved,
    },
    {
      label: "Hadir hari ini",
      value: overviewStats?.presentToday ?? presentToday,
    },
    {
      label: "Sedang bekerja",
      value: overviewStats?.currentlyActive ?? currentlyActive,
    },
  ]

  return (
    <div className="flex flex-col">
      <div className="my-2 grid grid-cols-2 gap-x-8 gap-y-4 py-2 lg:grid-cols-5">
        {stats.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-col gap-1">
            <p className="text-muted-foreground text-sm">{item.label}</p>
            <p className="text-foreground text-lg font-medium tabular-nums">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="border-border space-y-3 border-b pt-2">
        <div className="xl:hidden">
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
                <SelectItem value="approval">Persetujuan</SelectItem>
                <SelectItem value="attendance">Kehadiran</SelectItem>
                <SelectItem value="remaining">Saldo Cuti</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="bg-foreground/[0.03] h-9 w-full rounded-md" />
          )}
        </div>
        <div className="hidden items-start justify-between gap-4 xl:flex">
          <TabNavigation className="border-b-0">
            <TabNavigationLink
              active={activeTab === "approval"}
              onClick={() => onTabChange("approval")}
              showLeadingIcon={false}
            >
              Persetujuan
            </TabNavigationLink>
            <TabNavigationLink
              active={activeTab === "attendance"}
              onClick={() => onTabChange("attendance")}
              showLeadingIcon={false}
            >
              Kehadiran
            </TabNavigationLink>
            <TabNavigationLink
              active={activeTab === "remaining"}
              onClick={() => onTabChange("remaining")}
              showLeadingIcon={false}
            >
              Saldo Cuti
            </TabNavigationLink>
          </TabNavigation>
        </div>
        {/* Visible on every screen size (used to be desktop-only). */}
        {activeTab === "approval" && (
          <div className="flex justify-end pb-2 xl:-mt-12">
            <Button variant="outline" onClick={onAddManualLeave}>
              Tambah manual
            </Button>
          </div>
        )}
      </div>

      <div className="py-4">
        {activeTab === "approval" && (
          <div className="block space-y-5">{approvalContent}</div>
        )}
        {isMounted("remaining") && (
          <div
            className={
              activeTab === "remaining" ? "block space-y-5" : "hidden space-y-5"
            }
          >
            {remainingContent}
          </div>
        )}
        {isMounted("attendance") && (
          <div
            className={
              activeTab === "attendance"
                ? "block space-y-5"
                : "hidden space-y-5"
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

// --- SUB-COMPONENT (Sekarang lebih sederhana & cepat) ---
function RemainingLeaveView({ data }: { data: Profile[] }) {
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
