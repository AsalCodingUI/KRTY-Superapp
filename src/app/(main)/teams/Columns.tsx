"use client"

import { EmptyValue } from "@/components/empty-value"
import { Database } from "@/shared/types/database.types"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { DataTableColumnHeader } from "@/components/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { MessageKey } from "@/shared/i18n/messages"
import { canManageByRole } from "@/shared/lib/roles"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

const columnHelper = createColumnHelper<Profile>()

type TeamColumnsOptions = {
  canSelect?: boolean
  /** Translator for the "teams" namespace. */
  t: (key: MessageKey<"teams">) => string
}

export const createTeamColumns = ({
  canSelect = true,
  t,
}: TeamColumnsOptions) =>
  [
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
            meta: {
              displayName: t("selectRow"),
            },
          }),
        ]
      : []),
    columnHelper.accessor("full_name", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("colName")}
          className="whitespace-nowrap"
        />
      ),
      enableSorting: true,
      meta: {
        className: "text-left",
        displayName: t("colName"),
      },
      cell: ({ row }) => {
        const name = (row.getValue("full_name") as string) || t("unknownName")
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()

        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-5">
              <AvatarImage
                src={row.original.avatar_url || undefined}
                alt={name}
              />
              <AvatarFallback className="text-[10px]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground whitespace-nowrap" title={name}>
              {name}
            </span>
          </div>
        )
      },
    }),
    columnHelper.accessor("job_title", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("colJobTitle")}
          className="whitespace-nowrap"
        />
      ),
      enableSorting: false,
      meta: {
        className: "text-left whitespace-nowrap",
        displayName: t("colJobTitle"),
      },
      cell: ({ row }) => (
        <Badge variant="secondary">
          {(row.getValue("job_title") as string) || t("noJobTitle")}
        </Badge>
      ),
    }),
    columnHelper.accessor("role", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("colAccess")}
          className="whitespace-nowrap"
        />
      ),
      enableSorting: false,
      meta: {
        className: "text-left",
        displayName: t("colAccess"),
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {canManageByRole(row.getValue("role") as string)
            ? t("accessStakeholder")
            : t("accessEmployee")}
        </span>
      ),
    }),
    columnHelper.accessor("email", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("colEmail")}
          className="whitespace-nowrap"
        />
      ),
      enableSorting: false,
      meta: {
        className: "text-left",
        displayName: t("colEmail"),
      },
      cell: ({ row }) => {
        const email = row.getValue("email") as string | null
        if (!email) return <EmptyValue />
        return (
          <a
            href={`mailto:${email}`}
            className="text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
          >
            {email}
          </a>
        )
      },
    }),
  ] as ColumnDef<Profile>[]
