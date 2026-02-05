"use client"

import { Badge } from "@/shared/ui"
import { Button } from "@/shared/ui"
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
): ColumnDef<AttendanceLogWithProfile>[] => [
  {
    accessorKey: "profiles.full_name",
    header: "Employee",
    cell: ({ row }) => {
      const fullName = row.original.profiles?.full_name || "Unknown"
      const initials = fullName.slice(0, 2).toUpperCase()

      return (
        <div className="flex items-center gap-3">
          <div className="bg-surface-neutral-secondary text-foreground-secondary flex size-5 items-center justify-center rounded-full text-[10px] leading-[16px]">
            {initials}
          </div>
          <span
            className="text-foreground-primary font-medium whitespace-nowrap"
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
    header: "Clock In",
    cell: ({ row }) => (
      <span className="text-foreground-primary tabular-nums">
        {format(new Date(row.original.clock_in), "HH:mm")}
      </span>
    ),
    meta: { className: "w-[15%]", displayName: "Clock In" },
  },
  {
    accessorKey: "is_break",
    header: "Break",
    cell: ({ row }) => {
      if (row.original.is_break) {
        return <Badge variant="warning">On Break</Badge>
      }
      return (
        <span className="text-foreground-secondary tabular-nums">
          {row.original.break_total ? `${row.original.break_total}m` : "-"}
        </span>
      )
    },
    meta: { className: "w-[15%]", displayName: "Break" },
  },
  {
    accessorKey: "clock_out",
    header: "Clock Out",
    cell: ({ row }) => {
      if (row.original.clock_out) {
        return (
          <span className="text-foreground-primary tabular-nums">
            {format(new Date(row.original.clock_out), "HH:mm")}
          </span>
        )
      }
      return (
        <span className="font-medium text-foreground-success-dark">Active</span>
      )
    },
    meta: { className: "w-[15%]", displayName: "Clock Out" },
  },
  {
    id: "working_duration",
    header: "Working Duration",
    cell: ({ row }) => {
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
        <span className="text-foreground-primary font-medium tabular-nums">
          {hours}h {mins}m
        </span>
      )
    },
    meta: { className: "w-[15%]", displayName: "Working Duration" },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "Cuti Masuk" ? "warning" : "zinc"}
      >
        {row.original.status}
      </Badge>
    ),
    meta: { className: "w-[15%]", displayName: "Status" },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const hasDeleteRequest = row.original.notes === "DELETE_REQUESTED"
      if (!onApproveDelete || !hasDeleteRequest) return null

      return (
        <Button
          variant="tertiary"
          size="sm"
          onClick={() => onApproveDelete(row.original.id)}
        >
          Approve Delete
        </Button>
      )
    },
    meta: { className: "w-[15%]", displayName: "Actions" },
  },
]
