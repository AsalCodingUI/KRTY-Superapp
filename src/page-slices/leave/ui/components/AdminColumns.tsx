"use client"

import { ProofLink } from "@/entities/leave/ui/ProofLink"
import { EmptyValue } from "@/components/empty-value"
import { DataTableColumnHeader } from "@/components/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { MessageKey } from "@/shared/i18n/messages"
import { leaveTypeLabel } from "@/shared/lib/leave"
import type { Locale } from "date-fns"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  formatLeaveRange,
  type LeaveRequestWithProfile,
} from "./AdminLeaveList"
import { RiCheckLine, RiCloseLine } from "@/shared/ui/lucide-icons"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"

export type { LeaveRequestWithProfile }

const columnHelper = createColumnHelper<LeaveRequestWithProfile>()

type LeaveT = (key: MessageKey<"leave">) => string

const getStatusBadge = (status: string, t: LeaveT) => {
  switch (status) {
    case "approved":
      return <Badge variant="success">{t("statusApproved")}</Badge>
    case "rejected":
      return <Badge variant="destructive">{t("statusRejected")}</Badge>
    default:
      return <Badge variant="warning">{t("statusPending")}</Badge>
  }
}

type AdminColumnsOptions = {
  canSelect?: boolean
  canManage?: boolean
  /** Translator for the "leave" namespace. */
  t: LeaveT
  dateLocale?: Locale
}

export const adminColumns = (
  onApprove: (id: number) => void,
  onReject: (id: number) => void,
  options: AdminColumnsOptions,
) => {
  const { canSelect = true, canManage = true, t, dateLocale } = options

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
                aria-label={t("selectAll")}
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={() => row.toggleSelected()}
                className=""
                aria-label={t("selectRow")}
              />
            ),
            enableSorting: false,
            enableHiding: false,
            // Phones review one at a time; bulk selection is for desktop.
            meta: { displayName: t("selectRow"), className: "max-md:hidden" },
          }),
        ]
      : []),

    // 2. Employee Name (FIXED ID HERE)
    columnHelper.accessor("profiles.full_name", {
      id: "full_name", // <--- INI PERBAIKANNYA SUPAYA SEARCH BAR BERFUNGSI
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("colEmployee")}
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const name = row.original.profiles?.full_name || t("unknownName")
        const initials = name.slice(0, 2).toUpperCase()
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-5 max-md:size-8">
              <AvatarImage
                src={row.original.profiles?.avatar_url || undefined}
                alt={name}
              />
              <AvatarFallback className="text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span
                className="text-foreground font-medium whitespace-nowrap max-md:truncate"
                title={name}
              >
                {name}
              </span>
              {/* Date and type get their own columns from md up. */}
              <span className="text-muted-foreground truncate text-[13px] tabular-nums md:hidden">
                {formatLeaveRange(
                  row.original.start_date,
                  row.original.end_date,
                  dateLocale,
                )}{" "}
                · {leaveTypeLabel(row.original.leave_type, t)}
              </span>
            </div>
          </div>
        )
      },
      meta: {
        displayName: t("colEmployee"),
        className: "max-md:w-full max-md:max-w-0",
      },
    }),

    // 3. Date Range
    columnHelper.accessor("start_date", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("colDate")}
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => (
        <span className="text-foreground whitespace-nowrap tabular-nums">
          {formatLeaveRange(
            row.original.start_date,
            row.original.end_date,
            dateLocale,
          )}
        </span>
      ),
      meta: { displayName: t("colDate"), className: "max-md:hidden" },
    }),

    // 5. Type
    columnHelper.accessor("leave_type", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("colType")}
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => leaveTypeLabel(row.original.leave_type, t),
      meta: {
        displayName: t("colType"),
        className: "whitespace-nowrap max-md:hidden",
      },
    }),

    // 6. Reason
    columnHelper.accessor("reason", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("colReason")}
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => {
        const reason = row.original.reason
        const proof = row.original.proof_url
        return (
          // Shrinks with the window (down to ~7rem) so the table fits the
          // page instead of scrolling sideways on laptop widths.
          <div className="flex max-w-[clamp(7rem,calc(100vw-66rem),17.5rem)] items-center gap-1.5">
            <span
              className="text-muted-foreground truncate"
              title={reason || ""}
            >
              {reason || <EmptyValue />}
            </span>
            {proof && <ProofLink value={proof} iconOnly />}
          </div>
        )
      },
      meta: { displayName: t("colReason"), className: "max-md:hidden" },
    }),

    // 8. Status
    columnHelper.accessor("status", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("colStatus")}
          className="whitespace-nowrap"
        />
      ),
      cell: ({ row }) => getStatusBadge(row.getValue("status"), t),
      meta: { displayName: t("colStatus") },
    }),

    ...(canManage
      ? [
          columnHelper.display({
            id: "actions",
            header: () => <span className="sr-only">{t("colActions")}</span>,
            meta: { className: "text-right", displayName: t("colActions") },
            cell: ({ row }) => {
              const item = row.original
              if (item.status !== "pending") return null

              return (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    title={t("reject")}
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
                    className="text-success-ink"
                    title={t("approve")}
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
