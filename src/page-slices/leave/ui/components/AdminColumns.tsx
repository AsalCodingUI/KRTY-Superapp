"use client"

import { EmptyValue } from "@/components/empty-value"
import { DataTableColumnHeader } from "@/components/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LEAVE_TYPE_LABELS } from "@/shared/lib/leave"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  formatLeaveRange,
  type LeaveRequestWithProfile,
} from "./AdminLeaveList"
import {
  RiCheckLine,
  RiCloseLine,
  RiFilePaperLine,
} from "@/shared/ui/lucide-icons"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"

export type { LeaveRequestWithProfile }

const columnHelper = createColumnHelper<LeaveRequestWithProfile>()

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge variant="success">Disetujui</Badge>
    case "rejected":
      return <Badge variant="destructive">Ditolak</Badge>
    default:
      return <Badge variant="warning">Menunggu</Badge>
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
          title="Karyawan"
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
          title="Tanggal"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => (
        <span className="text-foreground whitespace-nowrap tabular-nums">
          {formatLeaveRange(row.original.start_date, row.original.end_date)}
        </span>
      ),
      meta: { displayName: "Date Range" },
    }),

    // 5. Type
    columnHelper.accessor("leave_type", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Jenis"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) =>
        LEAVE_TYPE_LABELS[row.original.leave_type] ?? row.original.leave_type,
      meta: { displayName: "Jenis", className: "whitespace-nowrap" },
    }),

    // 6. Reason
    columnHelper.accessor("reason", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Alasan"
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const reason = row.original.reason
        const proof = row.original.proof_url
        return (
          <div className="flex max-w-[280px] items-center gap-1.5">
            <span
              className="text-muted-foreground truncate"
              title={reason || ""}
            >
              {reason || <EmptyValue />}
            </span>
            {proof && (
              <a
                href={proof}
                target="_blank"
                rel="noopener noreferrer"
                title="Lihat bukti"
                aria-label="Lihat bukti"
                onClick={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                <RiFilePaperLine className="size-3.5" />
              </a>
            )}
          </div>
        )
      },
      meta: { displayName: "Reason" },
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
            header: () => <span className="sr-only">Aksi</span>,
            meta: { className: "text-right", displayName: "Action" },
            cell: ({ row }) => {
              const item = row.original
              if (item.status !== "pending") return null

              return (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    title="Tolak"
                    // Don't also toggle the row's selection.
                    onClick={(e) => {
                      e.stopPropagation()
                      onReject(item.id)
                    }}
                  >
                    <RiCloseLine className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-success"
                    title="Setujui"
                    onClick={(e) => {
                      e.stopPropagation()
                      onApprove(item.id)
                    }}
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
