import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  RiArchiveLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiRefreshLine,
} from "@/shared/ui/lucide-icons"
import { ColumnDef } from "@tanstack/react-table"

// Define the shape of our data (must match SLADashboard definition)
export interface SLA {
  id: string
  client_name: string
  title: string
  status: string
  created_at: string | null
  archived_at: string | null
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
    accessorKey: "client_name",
    header: "Client Name",
  },
  {
    accessorKey: "title",
    header: "Project/Title",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <Badge variant="secondary">{getValue() as string}</Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
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
      accessorKey: "client_name",
      header: "Client Name",
    },
    {
      accessorKey: "title",
      header: "Project/Title",
    },
    {
      accessorKey: "archived_at",
      header: "Archived At",
      cell: ({ getValue }) => {
        const val = getValue() as string | null
        return val ? new Date(val).toLocaleDateString() : "-"
      },
    },
  ]

  if (options.canManage === false) {
    return baseColumns
  }

  return [
    ...baseColumns,
    {
      id: "actions",
      header: "Actions",
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
