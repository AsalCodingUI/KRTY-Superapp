import { ViewOptions } from "@/shared/ui/data/DataTableViewOptions"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

type Person = {
  id: string
  full_name: string
  role: string
  email: string
}

const meta = {
  title: "Data/DataTableViewOptions",
  component: ViewOptions,
  tags: ["autodocs"],
} satisfies Meta<typeof ViewOptions>

export default meta
type Story = StoryObj<typeof meta>

const data: Person[] = [
  {
    id: "1",
    full_name: "Bima Sakti",
    role: "Designer",
    email: "bima@example.com",
  },
  {
    id: "2",
    full_name: "Siti Nabila",
    role: "Developer",
    email: "siti@example.com",
  },
]

const columns: ColumnDef<Person>[] = [
  { accessorKey: "full_name", header: "Employee", meta: { displayName: "Employee" } },
  { accessorKey: "role", header: "Role", meta: { displayName: "Role" } },
  { accessorKey: "email", header: "Email", meta: { displayName: "Email" } },
]

export const Default: Story = {
  args: {
    table: {} as any,
  },
  render: () => {
    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
    })

    return (
      <div className="min-w-[1024px] p-4">
        <ViewOptions table={table} />
      </div>
    )
  },
}
