import { DataTable, type DataTableProps } from "@/shared/ui/data/DataTable"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ColumnDef } from "@tanstack/react-table"

type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      return formatted
    },
  },
]

const data: Payment[] = [
  {
    id: "728ed52f",
    amount: 100,
    status: "pending",
    email: "m@example.com",
  },
  {
    id: "489e1d42",
    amount: 125,
    status: "processing",
    email: "example@gmail.com",
  },
  {
    id: "12345678",
    amount: 50,
    status: "success",
    email: "test@example.com",
  },
]

const meta = {
  title: "Data/DataTable",
  component: DataTable,
  tags: ["autodocs"],
} satisfies Meta<DataTableProps<Payment>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    columns: columns as any, // Cast to any to avoid complex generic inference in Storybook types
    data,
    searchKey: "email",
    actionLabel: "New Payment",
  },
}

export const WithPagination: Story = {
  args: {
    columns: columns as any,
    data: [...data, ...data, ...data], // Duplicate data to show pagination
    searchKey: "email",
  },
}

export const WithTableWrapper: Story = {
  args: {
    columns: columns as any,
    data,
    showTableWrapper: true,
    tableTitle: "Payments",
    tableDescription: "Manage your payment transactions.",
  },
}

export const NoSelection: Story = {
  args: {
    columns: columns as any,
    data,
    enableSelection: false,
    showFilterbar: true,
    searchKey: "email",
  },
}

export const NoFilterbar: Story = {
  args: {
    columns: columns as any,
    data,
    showFilterbar: false,
  },
}

export const NoPagination: Story = {
  args: {
    columns: columns as any,
    data,
    showPagination: false,
  },
}
