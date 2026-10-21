"use client"

import { DataTableColumnHeader } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from "@/shared/lib/leave"
import { Database } from "@/shared/types/database.types"
import { RiFilePaperLine } from "@/shared/ui/lucide-icons"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

const columnHelper = createColumnHelper<LeaveRequest>()

const STATUS_VARIANT = {
  approved: "success",
  rejected: "destructive",
  pending: "warning",
} as const

export const columns = ({
  onEdit,
  onCancel,
}: {
  onEdit: (item: LeaveRequest) => void
  onCancel: (item: LeaveRequest) => void
}) =>
  [
    columnHelper.accessor("start_date", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tanggal" />
      ),
      cell: ({ row }) => {
        const start = new Date(row.original.start_date)
        const end = new Date(row.original.end_date)
        return (
          <span className="whitespace-nowrap tabular-nums">
            {format(start, "d MMM", { locale: idLocale })}
            <span className="text-muted-foreground mx-1">–</span>
            {format(end, "d MMM yyyy", { locale: idLocale })}
          </span>
        )
      },
      meta: { displayName: "Tanggal" },
    }),

    columnHelper.accessor("leave_type", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Jenis" />
      ),
      cell: ({ row }) =>
        LEAVE_TYPE_LABELS[row.original.leave_type] ?? row.original.leave_type,
      enableSorting: false,
      meta: { displayName: "Jenis" },
    }),

    columnHelper.accessor("reason", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Alasan" />
      ),
      cell: ({ row }) => (
        <div
          className="max-w-[240px] truncate"
          title={row.original.reason || ""}
        >
          {row.original.reason || (
            <span className="text-muted-foreground/60">—</span>
          )}
        </div>
      ),
      enableSorting: false,
      meta: { displayName: "Alasan" },
    }),

    columnHelper.accessor("proof_url", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bukti" />
      ),
      cell: ({ row }) => {
        const url = row.original.proof_url
        if (!url) return <span className="text-muted-foreground/60">—</span>
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            <RiFilePaperLine className="size-3.5" /> Lihat
          </a>
        )
      },
      enableSorting: false,
      meta: { displayName: "Bukti" },
    }),

    columnHelper.accessor("status", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const { status, review_note } = row.original
        return (
          <div className="flex flex-col items-start gap-0.5">
            <Badge variant={STATUS_VARIANT[status]}>
              {LEAVE_STATUS_LABELS[status] ?? status}
            </Badge>
            {review_note && (
              <span
                className="text-muted-foreground max-w-[220px] truncate text-xs"
                title={review_note}
              >
                {review_note}
              </span>
            )}
          </div>
        )
      },
      enableSorting: false,
      meta: { displayName: "Status" },
    }),

    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Aksi</span>,
      meta: { className: "text-right", displayName: "Aksi" },
      cell: ({ row }) => {
        const item = row.original
        if (item.status === "approved") return null
        return (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" onClick={() => onEdit(item)}>
              {item.status === "rejected" ? "Ajukan ulang" : "Ubah"}
            </Button>
            {item.status === "pending" && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => onCancel(item)}
              >
                Batalkan
              </Button>
            )}
          </div>
        )
      },
      enableSorting: false,
    }),
  ] as ColumnDef<LeaveRequest>[]
