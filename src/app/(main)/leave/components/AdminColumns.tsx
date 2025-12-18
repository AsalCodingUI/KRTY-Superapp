"use client"

import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import { Database } from "@/lib/database.types";
import { RiCheckLine, RiCloseLine, RiFilePaperLine } from "@remixicon/react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";

export type LeaveRequestWithProfile = Database["public"]["Tables"]["leave_requests"]["Row"] & {
    profiles: { full_name: string; avatar_url: string | null } | null
}

const columnHelper = createColumnHelper<LeaveRequestWithProfile>()

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved': return <Badge variant="success">Approved</Badge>
        case 'rejected': return <Badge variant="error">Rejected</Badge>
        default: return <Badge variant="warning">Pending</Badge>
    }
}

export const adminColumns = (
    onApprove: (id: number) => void,
    onReject: (id: number) => void
) => [
    // 1. SELECT CHECKBOX
    columnHelper.display({
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected()
                        ? true
                        : table.getIsSomeRowsSelected()
                            ? "indeterminate"
                            : false
                }
                onCheckedChange={() => table.toggleAllPageRowsSelected()}
                className="translate-y-0.5"
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={() => row.toggleSelected()}
                className="translate-y-0.5"
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        meta: { displayName: "Select" }
    }),

    // 2. Employee Name (FIXED ID HERE)
    columnHelper.accessor("profiles.full_name", {
        id: "full_name", // <--- INI PERBAIKANNYA SUPAYA SEARCH BAR BERFUNGSI
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Employee" className="whitespace-nowrap" />
        ),
        cell: ({ row }) => {
            const name = row.original.profiles?.full_name || "Unknown"
            const initials = name.slice(0, 2).toUpperCase()
            return (
                <div className="flex items-center gap-3">
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-content-subtle dark:bg-hover dark:text-content-subtle">
                        {initials}
                    </span>
                    <span className="font-medium text-content dark:text-content whitespace-nowrap">
                        {name}
                    </span>
                </div>
            )
        },
        meta: { displayName: "Employee" }
    }),

    // 3. Date Range
    columnHelper.accessor("start_date", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Date Range" className="whitespace-nowrap" />
        ),
        cell: ({ row }) => {
            const start = new Date(row.original.start_date)
            const end = new Date(row.original.end_date)
            return (
                <span className="whitespace-nowrap text-content dark:text-content">
                    {format(start, "dd MMM")}
                    <span className="text-content-placeholder mx-1">-</span>
                    {format(end, "dd MMM yyyy")}
                </span>
            )
        },
        meta: { displayName: "Date Range" }
    }),

    // 4. Type
    columnHelper.accessor("leave_type", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Type" className="whitespace-nowrap" />
        ),
        meta: { displayName: "Type", className: "whitespace-nowrap" }
    }),

    // 5. Reason
    columnHelper.accessor("reason", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Reason" className="whitespace-nowrap" />
        ),
        cell: ({ row }) => (
            <div className="max-w-[200px] truncate" title={row.getValue("reason") || ""}>
                {row.getValue("reason")}
            </div>
        ),
        meta: { displayName: "Reason" }
    }),

    // 6. Proof
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

    // 7. Status
    columnHelper.accessor("status", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" className="whitespace-nowrap" />
        ),
        cell: ({ row }) => getStatusBadge(row.getValue("status")),
        meta: { displayName: "Status" }
    }),

    // 8. Actions
    columnHelper.display({
        id: "actions",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Action" className="text-right whitespace-nowrap" />
        ),
        meta: { className: "text-right", displayName: "Action" },
        cell: ({ row }) => {
            const item = row.original
            if (item.status !== 'pending') return null

            return (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        className="p-1 aspect-square text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20"
                        title="Reject"
                        onClick={() => onReject(item.id)}
                    >
                        <RiCloseLine className="size-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        className="p-1 aspect-square text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-900/20"
                        title="Approve"
                        onClick={() => onApprove(item.id)}
                    >
                        <RiCheckLine className="size-4" />
                    </Button>
                </div>
            )
        },
        enableSorting: false,
    }),
] as ColumnDef<LeaveRequestWithProfile>[]