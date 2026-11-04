import type { ProjectStatus } from "@/page-slices/projects/lib/status"

/** Mock labels for /ui → Badge (status maps as the app uses them). */

type Variant =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "secondary"
  | "outline"

export const domains: {
  title: string
  source: string
  items: [string, Variant][]
}[] = [
  {
    title: "Pengajuan cuti",
    source: "entities/leave/ui/LeaveStatus.tsx (LeaveStatusBadge)",
    items: [
      ["Disetujui", "success"],
      ["Menunggu", "warning"],
      ["Ditolak", "destructive"],
    ],
  },
  {
    title: "Jenis cuti",
    source: "leave/ui/components/AdminLeaveList.tsx (LEAVE_TYPE_BADGE)",
    items: [
      ["Cuti tahunan", "info"],
      ["Sakit", "warning"],
      ["WFH", "secondary"],
    ],
  },
  {
    title: "Invoice",
    source: "projects/ui/workspace/ProjectInvoices.tsx (STATUS)",
    items: [
      ["Draft", "secondary"],
      ["Terkirim", "info"],
      ["Sebagian", "warning"],
      ["Lunas", "success"],
      ["Terlambat", "destructive"],
      ["Refund", "secondary"],
    ],
  },
  {
    title: "Langkah proses",
    source: "projects/ui/workspace/StepStatusBadge.tsx",
    items: [
      ["Selesai", "success"],
      ["Belum selesai", "secondary"],
    ],
  },
  {
    title: "Kebijakan",
    source: "policies/ui/PoliciesPage.tsx (POLICY_STATUS_VARIANT)",
    items: [
      ["Ada draf", "warning"],
      ["Draf", "secondary"],
      ["Diarsipkan", "secondary"],
    ],
  },
  {
    title: "Tanggal / absensi",
    source: "attendance/components/AttendanceHistoryList.tsx",
    items: [
      ["Hari ini", "info"],
      ["Kemarin", "secondary"],
    ],
  },
]

export const projectStatuses: [ProjectStatus, string, string | null][] = [
  ["Planned", "Planned", "todo"],
  ["Active", "Active", "in_progress"],
  ["Review", "Review", "review"],
  ["Paused", "Paused", null],
  ["Completed", "Completed", "done"],
  ["Archived", "Archived", null],
]

export const LEAVE_VARIANT = {
  approved: "success",
  pending: "warning",
  rejected: "destructive",
} as const

export const leaveRows: {
  id: string
  reason: string
  range: string
  status: keyof typeof LEAVE_VARIANT
  label: string
}[] = [
  {
    id: "l1",
    reason: "Liburan keluarga",
    range: "12–16 Des",
    status: "approved",
    label: "Disetujui",
  },
  {
    id: "l2",
    reason: "Kontrol dokter",
    range: "20 Nov",
    status: "pending",
    label: "Menunggu",
  },
  {
    id: "l3",
    reason: "Acara keluarga",
    range: "3 Nov",
    status: "rejected",
    label: "Ditolak",
  },
  {
    id: "l4",
    reason: "Urus dokumen",
    range: "28 Nov",
    status: "pending",
    label: "Menunggu",
  },
]
