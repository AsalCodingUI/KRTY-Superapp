import { DataTableColumnHeader } from "@/shared/ui/data/DataTableColumnHeader"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useMemo, useState } from "react"

type Person = {
  id: string
  full_name: string
  role: string
}

const meta = {
  title: "Data/DataTableColumnHeader",
  component: DataTableColumnHeader,
  tags: ["autodocs"],
} satisfies Meta<typeof DataTableColumnHeader>

export default meta
type Story = StoryObj<typeof meta>

const data: Person[] = [
  { id: "1", full_name: "Bima Sakti", role: "Designer" },
  { id: "2", full_name: "Siti Nabila", role: "Developer" },
]

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: "full_name",
    header: "Employee",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
]

export const Sortable: Story = {
  args: {
    column: {} as any,
    title: "Employee",
  },
  render: () => {
    const [sorting, setSorting] = useState<SortingState>([])
    const table = useReactTable({
      data,
      columns,
      state: { sorting },
      onSortingChange: setSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
    })

    const column = useMemo(() => table.getColumn("full_name"), [table])
    if (!column) return null

    return (
      <DataTableColumnHeader column={column} title="Employee" />
    )
  },
}

export const NotSortable: Story = {
  args: {
    column: {} as any,
    title: "Employee",
  },
  render: () => {
    const table = useReactTable({
      data,
      columns: [
        {
          accessorKey: "full_name",
          header: "Employee",
          enableSorting: false,
        },
      ],
      getCoreRowModel: getCoreRowModel(),
    })

    const column = table.getColumn("full_name")
    if (!column) return null
    return <DataTableColumnHeader column={column} title="Employee" />
  },
}
