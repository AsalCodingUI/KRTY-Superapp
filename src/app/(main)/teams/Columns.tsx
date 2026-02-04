"use client"

import { Database } from '@/shared/types/database.types'
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { Badge } from "@/shared/ui"
import { Checkbox } from "@/shared/ui"
import { DataTableColumnHeader } from "@/shared/ui";

// DataTableRowActions SUDAH DIHAPUS IMPORT-NYA

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

const columnHelper = createColumnHelper<Profile>()

// Formatter Rupiah
const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)
}

// Warna Warni Job Title
const getJobTitleVariant = (title: string) => {
    switch (title) {
        case "Admin": return "error"
        case "Project Manager": return "warning"
        case "Designer": return "success"
        case "Web Developer": return "default"
        default: return "zinc"
    }
}

export const columns = [
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
        meta: {
            displayName: "Select",
        },
    }),
    columnHelper.accessor("full_name", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" className="whitespace-nowrap" />
        ),
        enableSorting: true,
        meta: {
            className: "text-left",
            displayName: "Name",
        },
        cell: ({ row }) => {
            const name = row.getValue("full_name") as string
            const initials = name
                ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                : "U"

            return (
                <div className="flex items-center gap-x-3">
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-content-subtle dark:bg-hover dark:text-content-subtle">
                        {initials}
                    </span>
                    <span className="font-medium text-content dark:text-content whitespace-nowrap">
                        {name}
                    </span>
                </div>
            )
        },
    }),
    columnHelper.accessor("job_title", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Job Title" className="whitespace-nowrap" />
        ),
        enableSorting: false,
        meta: {
            className: "text-left whitespace-nowrap",
            displayName: "Job Title",
        },
        cell: ({ row }) => {
            const title = row.getValue("job_title") as string
            return <Badge variant={getJobTitleVariant(title)}>{title}</Badge>
        },
    }),
    columnHelper.accessor("role", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Role" className="whitespace-nowrap" />
        ),
        enableSorting: false,
        meta: {
            className: "text-left",
            displayName: "Role",
        },
        cell: ({ row }) => {
            const role = row.getValue("role") as string
            const displayRole = role.charAt(0).toUpperCase() + role.slice(1)
            const variant = role === "stakeholder" ? "success" : "zinc"
            return <Badge variant={variant}>{displayRole}</Badge>
        },
    }),
    columnHelper.accessor("hourly_rate", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Hourly Rate" className="whitespace-nowrap" />
        ),
        enableSorting: false,
        meta: {
            className: "text-right tabular-nums whitespace-nowrap",
            displayName: "Hourly Rate",
        },
        cell: ({ row }) => {
            const rate = row.getValue("hourly_rate") as number
            return <span>{formatRupiah(rate)}</span>
        },
    }),
    columnHelper.accessor("email", {
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" className="whitespace-nowrap" />
        ),
        enableSorting: false,
        meta: {
            className: "text-left", // HAPUS text-content-subtle BIAR DEFAULT
            displayName: "Email",
        },
    }),

    // KOLOM ACTIONS SUDAH DIHAPUS TOTAL
] as ColumnDef<Profile>[]