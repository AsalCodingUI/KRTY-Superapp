import { Filterbar } from "@/shared/ui/data/DataTableFilterbar"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnFiltersState,
} from "@tanstack/react-table"
import { useState } from "react"

type Person = {
  id: string
  full_name: string
  role: string
}

const meta = {
  title: "Data/DataTableFilterbar",
  component: Filterbar,
  tags: ["autodocs"],
} satisfies Meta<typeof Filterbar>

export default meta
type Story = StoryObj<typeof meta>

const data: Person[] = [
  { id: "1", full_name: "Bima Sakti", role: "Designer" },
  { id: "2", full_name: "Siti Nabila", role: "Developer" },
  { id: "3", full_name: "Rizal Dwi", role: "Project Manager" },
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

export const Default: Story = {
  args: {
    table: {} as any,
    onCreate: () => {},
    showExport: true,
    showViewOptions: true,
    actionLabel: "Create",
    searchKey: "full_name",
  },
  render: () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const table = useReactTable({
      data,
      columns,
      state: { columnFilters },
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    })

    return (
      <div className="min-w-[1024px] p-4">
        <Filterbar
          table={table}
          onCreate={() => {}}
          showExport
          showViewOptions
          actionLabel="Add Member"
          searchKey="full_name"
        />
      </div>
    )
  },
}

export const NoViewOptions: Story = {
  args: {
    table: {} as any,
    onCreate: () => {},
    showExport: true,
    showViewOptions: false,
    actionLabel: "Add Member",
    searchKey: "full_name",
  },
  render: () => {
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const table = useReactTable({
      data,
      columns,
      state: { columnFilters },
      onColumnFiltersChange: setColumnFilters,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    })

    return (
      <div className="min-w-[1024px] p-4">
        <Filterbar
          table={table}
          onCreate={() => {}}
          showExport
          showViewOptions={false}
          actionLabel="Add Member"
          searchKey="full_name"
        />
      </div>
    )
  },
}
