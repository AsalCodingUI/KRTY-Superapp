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
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

// Define the shape of our data (must match SLADashboard definition)
export interface SLA {
  id: string
  client_name: string
  title: string
  status: string
  created_at: string | null
  archived_at: string | null
}

function shortDate(value: string | null) {
  if (!value) return <EmptyValue />
  return (
    <span className="text-muted-foreground tabular-nums">
      {format(new Date(value), "d MMM yyyy", { locale: idLocale })}
    </span>
  )
}

type SLAColumnOptions = {
  canManage?: boolean
}

export const activeSLAColumns = (
  onEdit: (id: string) => void,
  onArchive: (id: string) => void,
  onView: (id: string) => void,
  options: SLAColumnOptions = {},
): ColumnDef<SLA>[] => [
  {
    accessorKey: "title",
    header: "SLA",
    cell: ({ row }) => row.original.title || "Tanpa judul",
  },
  {
    accessorKey: "client_name",
    header: "Klien",
  },
  {
    accessorKey: "created_at",
    header: "Dibuat",
    cell: ({ getValue }) => shortDate(getValue() as string | null),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Aksi</span>,
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
  options: SLAColumnOptions = {},
): ColumnDef<SLA>[] => {
  const baseColumns: ColumnDef<SLA>[] = [
    {
      accessorKey: "title",
      header: "SLA",
      cell: ({ row }) => row.original.title || "Tanpa judul",
    },
    {
      accessorKey: "client_name",
      header: "Klien",
    },
    {
      accessorKey: "archived_at",
      header: "Diarsipkan",
      cell: ({ getValue }) => shortDate(getValue() as string | null),
    },
  ]

  if (options.canManage === false) {
    return baseColumns
  }

  return [
    ...baseColumns,
    {
      id: "actions",
      header: () => <span className="sr-only">Aksi</span>,
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
