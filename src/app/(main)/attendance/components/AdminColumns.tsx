"use client"

import {
  ATTENDANCE_NOTE_TAGS,
  ATTENDANCE_STATUS_LABELS,
  hasAttendanceNote,
} from "@/shared/lib/attendance"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Database } from "@/shared/types/database.types"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"

type AttendanceLogWithProfile =
  Database["public"]["Tables"]["attendance_logs"]["Row"] & {
    profiles: {
      full_name: string
      avatar_url: string | null
      job_title: string | null
    } | null
  }

export const adminAttendanceColumns = (
  onApproveDelete?: (id: string) => void,
  onCloseSession?: (id: string) => void,
  onEditSession?: (id: string) => void,
): ColumnDef<AttendanceLogWithProfile>[] => [
  {
    accessorKey: "profiles.full_name",
    header: "Karyawan",
    cell: ({ row }) => {
      const fullName = row.original.profiles?.full_name || "Unknown"
      const initials = fullName.slice(0, 2).toUpperCase()

      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-5">
            <AvatarImage
              src={row.original.profiles?.avatar_url || undefined}
              alt={fullName}
            />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span
            className="text-foreground font-medium whitespace-nowrap"
            title={fullName}
          >
            {fullName}
          </span>
        </div>
      )
    },
    meta: { className: "w-1/4", displayName: "Employee" },
  },
  {
    accessorKey: "clock_in",
    header: "Masuk",
    cell: ({ row }) => (
      <span className="text-foreground tabular-nums">
        {format(new Date(row.original.clock_in), "HH:mm")}
      </span>
    ),
    meta: { className: "w-[15%]", displayName: "Clock In" },
  },
  {
    accessorKey: "is_break",
    header: "Istirahat",
    cell: ({ row }) => {
      if (row.original.is_break) {
        return <Badge variant="warning">Istirahat</Badge>
      }
      return (
        <span className="text-muted-foreground tabular-nums">
          {row.original.break_total ? `${row.original.break_total}m` : "-"}
        </span>
      )
    },
    meta: { className: "w-[15%]", displayName: "Break" },
  },
  {
    accessorKey: "clock_out",
    header: "Keluar",
    cell: ({ row }) => {
      if (row.original.clock_out) {
        return (
          <span className="text-foreground tabular-nums">
            {format(new Date(row.original.clock_out), "HH:mm")}
          </span>
        )
      }
      if (row.original.is_break) {
        return <Badge variant="warning">Istirahat</Badge>
      }
      return <span className="text-success font-medium">Aktif</span>
    },
    meta: { className: "w-[15%]", displayName: "Clock Out" },
  },
  {
    id: "working_duration",
    header: "Durasi",
    cell: ({ row }) => {
      if (row.original.is_break && !row.original.clock_out) {
        return <Badge variant="warning">Istirahat</Badge>
      }
      const clockIn = new Date(row.original.clock_in).getTime()
      const clockOut = row.original.clock_out
        ? new Date(row.original.clock_out).getTime()
        : new Date().getTime()

      let workingMs = clockOut - clockIn

      // Subtract accumulated break time
      workingMs -= (row.original.break_total || 0) * 60 * 1000

      // If currently on break, subtract current break duration
      if (
        row.original.is_break &&
        row.original.break_start &&
        !row.original.clock_out
      ) {
        const breakStart = new Date(row.original.break_start).getTime()
        const currentBreakMs = new Date().getTime() - breakStart
        workingMs -= currentBreakMs
      }

      if (workingMs < 0) workingMs = 0

      const hours = Math.floor(workingMs / (1000 * 60 * 60))
      const mins = Math.floor((workingMs % (1000 * 60 * 60)) / (1000 * 60))

      return (
        <span className="text-foreground font-medium tabular-nums">
          {hours}j {mins}m
        </span>
      )
    },
    meta: { className: "w-[15%]", displayName: "Working Duration" },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const wasEdited = hasAttendanceNote(
        row.original.notes,
        ATTENDANCE_NOTE_TAGS.adminEditedSession,
      )

      return (
        <div className="flex items-center gap-2">
          <Badge
            variant={
              row.original.status === "Cuti Masuk" ? "warning" : "secondary"
            }
          >
            {(row.original.status &&
              ATTENDANCE_STATUS_LABELS[row.original.status]) ??
              row.original.status}
          </Badge>
          {wasEdited && <Badge variant="info">Diedit</Badge>}
        </div>
      )
    },
    meta: { className: "w-[15%]", displayName: "Status" },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Aksi</span>,
    cell: ({ row }) => {
      const hasDeleteRequest = hasAttendanceNote(
        row.original.notes,
        ATTENDANCE_NOTE_TAGS.deleteRequested,
      )
      const isActiveSession = !row.original.clock_out

      if (isActiveSession && onCloseSession) {
        return (
          <Button
            variant="ghost"
            onClick={() => onCloseSession(row.original.id)}
          >
            Tutup Sesi
          </Button>
        )
      }

      if (!onEditSession && (!onApproveDelete || !hasDeleteRequest)) return null

      return (
        <div className="flex items-center gap-2">
          {onEditSession && (
            <Button
              variant="ghost"
              onClick={() => onEditSession(row.original.id)}
            >
              Edit
            </Button>
          )}
          {onApproveDelete && hasDeleteRequest && (
            <Button
              variant="ghost"
              onClick={() => onApproveDelete(row.original.id)}
            >
              Tinjau hapus
            </Button>
          )}
        </div>
      )
    },
    meta: { className: "w-[15%]", displayName: "Actions" },
  },
]
