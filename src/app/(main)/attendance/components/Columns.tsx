"use client"

import { Database } from "@/shared/types/database.types"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { format } from "date-fns"
import { Badge } from "@/shared/ui"
import { Button } from "@/shared/ui"
import { DataTableColumnHeader } from "@/shared/ui"

type AttendanceLog = Database["public"]["Tables"]["attendance_logs"]["Row"]

const columnHelper = createColumnHelper<AttendanceLog>()

// Helper hitung durasi (sama seperti sebelumnya, tapi dipindah ke sini)
const calculateDuration = (log: AttendanceLog) => {
  if (!log.clock_out) return "Active"
  const start = new Date(log.clock_in)
  const end = new Date(log.clock_out)
  let totalMs = end.getTime() - start.getTime()

  // Subtract break time (break_total is in minutes)
  totalMs -= (log.break_total || 0) * 60 * 1000

  if (totalMs < 0) totalMs = 0

  const hours = Math.floor(totalMs / (1000 * 60 * 60))
  const mins = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
  const secs = Math.floor((totalMs % (1000 * 60)) / 1000)
  return `${hours}h ${mins}m ${secs}s`
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
          title="Clock In"
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
          title="Clock Out"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const val = row.getValue("clock_out") as string
        return val ? (
          <span className="tabular-nums">{formatTime(val)}</span>
        ) : (
          <span className="font-medium text-emerald-600 dark:text-emerald-500">
            Active
          </span>
        )
      },
      meta: { className: "w-1/5", displayName: "Clock Out" },
    }),
    columnHelper.display({
      id: "total_work",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Total Work"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">{calculateDuration(row.original)}</span>
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
          <Badge variant={status === "Cuti Masuk" ? "warning" : "zinc"}>
            {status}
          </Badge>
        )
      },
      meta: { className: "w-1/5", displayName: "Status" },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (!onRequestDelete) return null
        return (
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onRequestDelete(row.original.id)}
          >
            Request Delete
          </Button>
        )
      },
      meta: { className: "w-1/5", displayName: "Actions" },
    }),
  ] as ColumnDef<AttendanceLog>[]
