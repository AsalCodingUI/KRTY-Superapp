"use client"

import { Badge } from "@/shared/ui"
import { DataTableColumnHeader } from "@/shared/ui/data/DataTableColumnHeader"
import { Database } from "@/shared/types/database.types"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

const columnHelper = createColumnHelper<Profile>()

const getJobTitleVariant = (title: string | null) => {
  switch (title) {
    case "Admin":
      return "error"
    case "Project Manager":
      return "warning"
    case "Designer":
      return "success"
    case "Web Developer":
      return "default"
    default:
      return "zinc"
  }
}

export const remainingLeaveColumns = [
  // 1. Employee Name & Avatar
  columnHelper.accessor("full_name", {
    id: "full_name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Employee"
        className="whitespace-nowrap"
      />
    ),
    cell: ({ row }) => {
      const name = (row.getValue("full_name") as string) || "Unknown"
      const initials = name.slice(0, 2).toUpperCase()
      return (
        <div className="flex items-center gap-3">
          <span className="bg-muted text-label-xs text-content-subtle dark:bg-hover dark:text-content-subtle inline-flex size-8 items-center justify-center rounded-full">
            {initials}
          </span>
          <span className="text-content dark:text-content font-medium whitespace-nowrap">
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
        title="Job Title"
        className="whitespace-nowrap"
      />
    ),
    cell: ({ row }) => {
      const title = row.getValue("job_title") as string
      return <Badge variant={getJobTitleVariant(title)}>{title || "-"}</Badge>
    },
    meta: { displayName: "Job Title" },
  }),

  // 3. Total Quota (Fixed 12 Days)
  columnHelper.display({
    id: "total_quota",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Total Quota"
        className="whitespace-nowrap"
      />
    ),
    cell: () => (
      <span className="text-content-subtle dark:text-content-placeholder tabular-nums">
        12 Days
      </span>
    ),
    meta: { displayName: "Total Quota" },
  }),

  // 4. Used -> Ambil 'leave_used' (Contoh Alex: 2)
  columnHelper.accessor("leave_used", {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Used"
        className="whitespace-nowrap"
      />
    ),
    cell: ({ row }) => (
      <span className="text-content-subtle dark:text-content-placeholder tabular-nums">
        {row.getValue("leave_used") ?? 0} Days
      </span>
    ),
    meta: { displayName: "Used" },
  }),

  // 5. Remaining -> Ambil 'leave_balance' (Contoh Alex: 10)
  columnHelper.accessor("leave_balance", {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Remaining"
        className="whitespace-nowrap"
      />
    ),
    cell: ({ row }) => (
      <span className="text-content dark:text-content font-medium tabular-nums">
        {row.getValue("leave_balance") ?? 12} Days
      </span>
    ),
    meta: { displayName: "Remaining" },
  }),
] as ColumnDef<Profile>[]
