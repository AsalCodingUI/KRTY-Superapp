"use client"

import { DataTableColumnHeader } from "@/components/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ANNUAL_LEAVE_QUOTA } from "@/shared/lib/leave"
import { Database } from "@/shared/types/database.types"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"

/** Balances come from the shared annual-leave summary (leave route). */
type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "full_name"
  | "avatar_url"
  | "job_title"
  | "leave_used"
  | "leave_balance"
> & { leave_quota?: number; leave_note?: string | null }

const columnHelper = createColumnHelper<Profile>()

const getJobTitleVariant = (title: string | null) => {
  switch (title) {
    case "Admin":
      return "destructive"
    case "Project Manager":
      return "warning"
    case "Designer":
      return "success"
    case "Web Developer":
      return "info"
    default:
      return "secondary"
  }
}

export const remainingLeaveColumns = [
  // 1. Employee Name & Avatar
  columnHelper.accessor("full_name", {
    id: "full_name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Karyawan"
        className="whitespace-nowrap"
      />
    ),
    cell: ({ row }) => {
      const name = (row.getValue("full_name") as string) || "Unknown"
      const initials = name.slice(0, 2).toUpperCase()
      const avatarUrl = row.original.avatar_url || undefined
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-5">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span
            className="text-foreground font-medium whitespace-nowrap"
            title={name}
          >
            {name}
          </span>
        </div>
      )
    },
    meta: { displayName: "Employee" },
  }),

  // 2. Job Title
  columnHelper.accessor("job_title", {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Jabatan"
        className="whitespace-nowrap"
      />
    ),
    cell: ({ row }) => {
      const title = row.getValue("job_title") as string
      return <Badge variant={getJobTitleVariant(title)}>{title || "-"}</Badge>
    },
    meta: { displayName: "Job Title" },
  }),

  columnHelper.display({
    id: "total_quota",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Jatah"
        className="whitespace-nowrap"
      />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-muted-foreground tabular-nums">
          {row.original.leave_quota ?? ANNUAL_LEAVE_QUOTA} hari
        </span>
        {row.original.leave_note && (
          <span className="text-muted-foreground/70 text-xs">
            {row.original.leave_note}
          </span>
        )}
      </div>
    ),
    meta: { displayName: "Jatah" },
  }),

  columnHelper.accessor("leave_used", {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Terpakai"
        className="whitespace-nowrap"
      />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.getValue("leave_used") ?? 0} hari
      </span>
    ),
    meta: { displayName: "Terpakai" },
  }),

  columnHelper.accessor("leave_balance", {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Sisa"
        className="whitespace-nowrap"
      />
    ),
    cell: ({ row }) => (
      <span className="text-foreground font-medium tabular-nums">
        {row.getValue("leave_balance") ?? ANNUAL_LEAVE_QUOTA} hari
      </span>
    ),
    meta: { displayName: "Sisa" },
  }),
] as ColumnDef<Profile>[]
