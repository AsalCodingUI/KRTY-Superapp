"use client"

import { Badge } from "@/shared/ui"
import { Button } from "@/shared/ui"
import { DataTableColumnHeader } from '@/shared/ui/data/DataTableColumnHeader'
import { Database } from '@/shared/types/database.types'
import { cx } from '@/shared/lib/utils'; // Tambahan import
import { RiEditLine, RiFilePaperLine } from "@remixicon/react"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { format } from "date-fns"

type LeaveRequest = Database["public"]["Tables"]["leave_requests"]["Row"]

const columnHelper = createColumnHelper<LeaveRequest>()

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved': return <Badge variant="success">Approved</Badge>
        case 'rejected': return <Badge variant="error">Rejected</Badge>
        default: return <Badge variant="warning">Pending</Badge>
    }
}

export const columns = (onEdit: (item: LeaveRequest) => void) => [
    columnHelper.display({
        id: "index",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="No" className="whitespace-nowrap" />
        ),
        cell: ({ row }) => <span className="text-content-subtle tabular-nums">{row.index + 1}</span>,
        enableSorting: false,
        meta: { displayName: "No" }
    }),

    columnHelper.accessor("start_date", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Date Range" className="whitespace-nowrap" />
        ),
        cell: ({ row }) => {
            const start = new Date(row.original.start_date)
            const end = new Date(row.original.end_date)
            return (
                <span className="whitespace-nowrap text-content dark:text-content">
                    {format(start, "dd MMM yyyy")}
                    <span className="text-content-subtle mx-1.5">s/d</span>
                    {format(end, "dd MMM yyyy")}
                </span>
            )
        },
        meta: { displayName: "Date Range" }
    }),

    columnHelper.accessor("leave_type", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Type" className="whitespace-nowrap" />
        ),
        enableSorting: false,
        meta: { className: "text-left whitespace-nowrap", displayName: "Type" },
    }),

    columnHelper.accessor("reason", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Reason" className="whitespace-nowrap" />
        ),
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate" title={row.getValue("reason") || ""}>
                {row.getValue("reason")}
            </div>
        ),
        enableSorting: false,
        meta: { displayName: "Reason" }
    }),

    columnHelper.accessor("proof_url", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Proof" className="whitespace-nowrap" />
        ),
        cell: ({ row }) => {
            const url = row.getValue("proof_url") as string
            if (!url) return <span className="text-content-placeholder text-xs">-</span>
            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-500 text-xs font-medium"
                >
                    <RiFilePaperLine className="size-3.5" /> View
                </a>
            )
        },
        enableSorting: false,
        meta: { displayName: "Proof" }
    }),

    columnHelper.accessor("status", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" className="whitespace-nowrap" />
        ),
        cell: ({ row }) => getStatusBadge(row.getValue("status")),
        enableSorting: false,
        meta: { displayName: "Status" }
    }),

    columnHelper.display({
        id: "actions",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Action" className="text-right whitespace-nowrap" />
        ),
        meta: { className: "text-right", displayName: "Action" },
        cell: ({ row }) => {
            const item = row.original
            // Hanya kunci jika Approved. Rejected bisa diedit untuk Resubmit.
            const isLocked = item.status === 'approved'
            const isRejected = item.status === 'rejected'

            return (
                <Button
                    variant="ghost"
                    className={cx(
                        "p-1 aspect-square",
                        // Beri warna orange jika Rejected agar user notice untuk resubmit
                        isRejected
                            ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-500 dark:hover:bg-orange-900/20"
                            : "text-content-subtle hover:text-content-subtle dark:text-content-placeholder"
                    )}
                    onClick={() => onEdit(item)}
                    disabled={isLocked}
                    title={isRejected ? "Fix & Resubmit" : "Edit Request"}
                >
                    <RiEditLine className="size-4" />
                </Button>
            )
        },
        enableSorting: false,
    }),
] as ColumnDef<LeaveRequest>[]