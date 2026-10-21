"use client"

import { Database } from "@/shared/types/database.types"
import {
  ATTENDANCE_NOTE_TAGS,
  ATTENDANCE_STATUS_LABELS,
  hasAttendanceNote,
} from "@/shared/lib/attendance"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { format } from "date-fns"
import { DataTableColumnHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

const columnHelper = createColumnHelper<AttendanceLog>()

// Helper hitung durasi (sama seperti sebelumnya, tapi dipindah ke sini)
const calculateDuration = (log: AttendanceLog) => {
  if (!log.clock_out) return "Aktif"
  const start = new Date(log.clock_in)
  const end = new Date(log.clock_out)
  let totalMs = end.getTime() - start.getTime()

  // Subtract break time (break_total is in minutes)
  totalMs -= (log.break_total || 0) * 60 * 1000

  if (totalMs < 0) totalMs = 0

  const hours = Math.floor(totalMs / (1000 * 60 * 60))
  const mins = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
  const secs = Math.floor((totalMs % (1000 * 60)) / 1000)
  return `${hours}j ${mins}m ${secs}d`
}

const formatTime = (dateString: string | null) => {
  if (!dateString) return "--:--"
  return format(new Date(dateString), "HH:mm")
}

export const columns = (onRequestDelete?: (id: string) => void) =>
  [
    columnHelper.accessor("clock_in", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Masuk"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {formatTime(row.getValue("clock_in"))}
        </span>
      ),
      meta: { className: "w-1/5", displayName: "Clock In" },
    }),
    columnHelper.accessor("clock_out", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Keluar"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const val = row.getValue("clock_out") as string
        if (val) {
          return <span className="tabular-nums">{formatTime(val)}</span>
        }
        if (row.original.is_break) {
          return <Badge variant="warning">Istirahat</Badge>
        }
        return <span className="text-success font-medium">Aktif</span>
      },
      meta: { className: "w-1/5", displayName: "Clock Out" },
    }),
    columnHelper.display({
      id: "total_work",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Durasi"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) =>
        row.original.is_break && !row.original.clock_out ? (
          <Badge variant="warning">Istirahat</Badge>
        ) : (
          <span className="tabular-nums">
            {calculateDuration(row.original)}
          </span>
        ),
      meta: { className: "w-1/5", displayName: "Total Work" },
    }),
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Status"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "Cuti Masuk" ? "warning" : "secondary"}>
            {ATTENDANCE_STATUS_LABELS[status] ?? status}
          </Badge>
        )
      },
      meta: { className: "w-1/5", displayName: "Status" },
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Aksi</span>,
      cell: ({ row }) => {
        if (!onRequestDelete) return null
        // Already asked: show the state instead of a second request.
        if (
          hasAttendanceNote(
            row.original.notes,
            ATTENDANCE_NOTE_TAGS.deleteRequested,
          )
        ) {
          return (
            <span className="text-muted-foreground text-xs">
              Menunggu dihapus
            </span>
          )
        }
        return (
          <Button
            variant="ghost"
            onClick={() => onRequestDelete(row.original.id)}
          >
            Minta hapus
          </Button>
        )
      },
      meta: { className: "w-1/5 text-right", displayName: "Aksi" },
    }),
  ] as ColumnDef<AttendanceLog>[]
