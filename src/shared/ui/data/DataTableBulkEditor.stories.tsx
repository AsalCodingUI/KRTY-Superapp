import { DataTableBulkEditor } from "@/shared/ui/data/DataTableBulkEditor"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table"
import { useState } from "react"

type Person = {
  id: string
  full_name: string
}

const meta = {
  title: "Data/DataTableBulkEditor",
  component: DataTableBulkEditor,
  tags: ["autodocs"],
} satisfies Meta<typeof DataTableBulkEditor>

export default meta
type Story = StoryObj<typeof meta>

const data: Person[] = [
  { id: "1", full_name: "Bima Sakti" },
  { id: "2", full_name: "Siti Nabila" },
  { id: "3", full_name: "Rizal Dwi" },
]

const columns: ColumnDef<Person>[] = [
  {
    accessorKey: "full_name",
    header: "Employee",
  },
]

export const WithSelection: Story = {
  args: {
    table: {} as any,
    rowSelection: {},
    onEdit: () => {},
    onDelete: async () => {},
  },
  render: () => {
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({
      "0": true,
      "1": true,
    })

    const table = useReactTable({
      data,
      columns,
      state: { rowSelection },
      onRowSelectionChange: setRowSelection,
      enableRowSelection: true,
      getCoreRowModel: getCoreRowModel(),
    })

    return (
      <div className="relative min-h-[120px] p-4">
        <DataTableBulkEditor
          table={table}
          rowSelection={rowSelection}
          onEdit={() => {}}
          onDelete={async () => {}}
        />
      </div>
    )
  },
}
