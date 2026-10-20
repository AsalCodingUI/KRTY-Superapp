"use client"

import { DataTableColumnHeader } from "@/components/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Database } from "@/shared/types/database.types"
import {
  RiCheckLine,
  RiCloseLine,
  RiFilePaperLine,
} from "@/shared/ui/lucide-icons"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { format } from "date-fns"

export type LeaveRequestWithProfile =
  Database["public"]["Tables"]["leave_requests"]["Row"] & {
    profiles: { full_name: string; avatar_url: string | null } | null
  }

const columnHelper = createColumnHelper<LeaveRequestWithProfile>()

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge variant="success">Approved</Badge>
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>
    default:
      return <Badge variant="warning">Pending</Badge>
  }
}

type AdminColumnsOptions = {
  canSelect?: boolean
  canManage?: boolean
}

export const adminColumns = (
  onApprove: (id: number) => void,
  onReject: (id: number) => void,
  options: AdminColumnsOptions = {},
) => {
  const { canSelect = true, canManage = true } = options

  return [
    ...(canSelect
      ? [
          columnHelper.display({
            id: "select",
            header: ({ table }) => (
              <Checkbox
                checked={table.getIsAllPageRowsSelected()}
                indeterminate={
                  !table.getIsAllPageRowsSelected() &&
                  table.getIsSomeRowsSelected()
                }
                onCheckedChange={() => table.toggleAllPageRowsSelected()}
                className=""
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={() => row.toggleSelected()}
                className=""
                aria-label="Select row"
              />
            ),
            enableSorting: false,
            enableHiding: false,
            meta: { displayName: "Select" },
          }),
        ]
      : []),

    // 2. Employee Name (FIXED ID HERE)
    columnHelper.accessor("profiles.full_name", {
      id: "full_name", // <--- INI PERBAIKANNYA SUPAYA SEARCH BAR BERFUNGSI
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Employee"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const name = row.original.profiles?.full_name || "Unknown"
        const initials = name.slice(0, 2).toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-5">
              <AvatarImage
                src={row.original.profiles?.avatar_url || undefined}
                alt={name}
              />
              <AvatarFallback className="text-[10px]">
                {initials}
              </AvatarFallback>
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

    // 3. Date Range
    columnHelper.accessor("start_date", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Date Range"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const start = new Date(row.original.start_date)
        const end = new Date(row.original.end_date)
        return (
          <span className="text-foreground whitespace-nowrap">
            {format(start, "dd MMM")}
            <span className="text-muted-foreground mx-1">-</span>
            {format(end, "dd MMM yyyy")}
          </span>
        )
      },
      meta: { displayName: "Date Range" },
    }),

    // 4. Submission Date (Admin only preview)
    columnHelper.accessor("created_at", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Submission Date"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue("created_at") as string | null
        if (!createdAt)
          return <span className="text-muted-foreground/50">-</span>
        const parsed = new Date(createdAt)
        if (Number.isNaN(parsed.getTime())) {
          return <span className="text-muted-foreground/50">-</span>
        }
        return (
          <span className="text-foreground whitespace-nowrap">
            {format(parsed, "dd MMM yyyy, HH:mm")}
          </span>
        )
      },
      meta: { displayName: "Submission Date" },
    }),

    // 5. Type
    columnHelper.accessor("leave_type", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Type"
          className="whitespace-nowrap"
        />
      ),
      meta: { displayName: "Type", className: "whitespace-nowrap" },
    }),

    // 6. Reason
    columnHelper.accessor("reason", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Reason"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => (
        <div
          className="max-w-[200px] truncate"
          title={row.getValue("reason") || ""}
        >
          {row.getValue("reason")}
        </div>
      ),
      meta: { displayName: "Reason" },
    }),

    // 7. Proof
    columnHelper.accessor("proof_url", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Proof"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const url = row.getValue("proof_url") as string
        if (!url) return <span className="text-muted-foreground/50">-</span>
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-label-xs text-primary hover:text-primary inline-flex items-center gap-1"
          >
            <RiFilePaperLine className="size-3.5" /> View
          </a>
        )
      },
      enableSorting: false,
      meta: { displayName: "Proof" },
    }),

    // 8. Status
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Status"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      meta: { displayName: "Status" },
    }),

    ...(canManage
      ? [
          columnHelper.display({
            id: "actions",
            header: ({ column }) => (
              <DataTableColumnHeader
                column={column}
                title="Action"
                className="text-right whitespace-nowrap"
              />
            ),
            meta: { className: "text-right", displayName: "Action" },
            cell: ({ row }) => {
              const item = row.original
              if (item.status !== "pending") return null

              return (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    title="Reject"
                    onClick={() => onReject(item.id)}
                  >
                    <RiCloseLine className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-success"
                    title="Approve"
                    onClick={() => onApprove(item.id)}
                  >
                    <RiCheckLine className="size-3.5" />
                  </Button>
                </div>
              )
            },
            enableSorting: false,
          }),
        ]
      : []),
  ] as ColumnDef<LeaveRequestWithProfile>[]
}
