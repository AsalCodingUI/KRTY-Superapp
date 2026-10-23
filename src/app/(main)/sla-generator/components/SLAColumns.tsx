import { EmptyValue } from "@/components/empty-value"
import { Button } from "@/components/ui/button"
import {
  RiArchiveLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiRefreshLine,
} from "@/shared/ui/lucide-icons"
import { ColumnDef } from "@tanstack/react-table"
import { format, type Locale } from "date-fns"
import type { MessageKey } from "@/shared/i18n/messages"

// Define the shape of our data (must match SLADashboard definition)
export interface SLA {
  id: string
  client_name: string
  title: string
  status: string
  created_at: string | null
  archived_at: string | null
}

function shortDate(value: string | null, locale: Locale) {
  if (!value) return <EmptyValue />
  return (
    <span className="text-muted-foreground tabular-nums">
      {format(new Date(value), "d MMM yyyy", { locale })}
    </span>
  )
}

type SLAColumnOptions = {
  canManage?: boolean
  /** Translator for the "sla" namespace and the date-fns locale. */
  t: (key: MessageKey<"sla">) => string
  dateLocale: Locale
}

export const activeSLAColumns = (
  onEdit: (id: string) => void,
  onArchive: (id: string) => void,
  onView: (id: string) => void,
  options: SLAColumnOptions,
): ColumnDef<SLA>[] => [
  {
    accessorKey: "title",
    header: options.t("colSla"),
    cell: ({ row }) => row.original.title || options.t("untitled"),
  },
  {
    accessorKey: "client_name",
    header: options.t("colClient"),
  },
  {
    accessorKey: "created_at",
    header: options.t("colCreated"),
    cell: ({ getValue }) =>
      shortDate(getValue() as string | null, options.dateLocale),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">{options.t("colActions")}</span>,
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onView(row.original.id)}
        >
          <RiEyeLine className="size-3.5" />
        </Button>
        {options.canManage !== false && (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(row.original.id)}
            >
              <RiEditLine className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onArchive(row.original.id)}
            >
              <RiArchiveLine className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    ),
  },
]

export const archivedSLAColumns = (
  onRestore: (id: string) => void,
  onDelete: (id: string) => void,
  options: SLAColumnOptions,
): ColumnDef<SLA>[] => {
  const baseColumns: ColumnDef<SLA>[] = [
    {
      accessorKey: "title",
      header: options.t("colSla"),
      cell: ({ row }) => row.original.title || options.t("untitled"),
    },
    {
      accessorKey: "client_name",
      header: options.t("colClient"),
    },
    {
      accessorKey: "archived_at",
      header: options.t("colArchived"),
      cell: ({ getValue }) =>
        shortDate(getValue() as string | null, options.dateLocale),
    },
  ]

  if (options.canManage === false) {
    return baseColumns
  }

  return [
    ...baseColumns,
    {
      id: "actions",
      header: () => <span className="sr-only">{options.t("colActions")}</span>,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onRestore(row.original.id)}
          >
            <RiRefreshLine className="size-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(row.original.id)}
          >
            <RiDeleteBinLine className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]
}
