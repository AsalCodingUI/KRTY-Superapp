import { DataTablePagination } from "@/shared/ui/data/DataTablePagination"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"

type Person = {
  id: string
  full_name: string
}

const meta = {
  title: "Data/DataTablePagination",
  component: DataTablePagination,
  tags: ["autodocs"],
} satisfies Meta<typeof DataTablePagination>

export default meta
type Story = StoryObj<typeof meta>

const data: Person[] = Array.from({ length: 24 }).map((_, index) => ({
  id: String(index + 1),
  full_name: `Member ${index + 1}`,
}))

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: "full_name",
    header: "Name",
  },
]

export const Default: Story = {
  args: {
    table: {} as any,
  },
  render: () => {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 })
    const table = useReactTable({
      data,
      columns,
      state: { pagination },
      onPaginationChange: setPagination,
      getCoreRowModel: getCoreRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
    })

    return (
      <div className="w-full">
        <DataTablePagination table={table} />
      </div>
    )
  },
}
