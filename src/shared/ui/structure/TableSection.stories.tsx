import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "./Table"
import { TableSection } from "./TableSection"

const meta: Meta<typeof TableSection> = {
  title: "Shared/UI/Structure/TableSection",
  component: TableSection,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof TableSection>

export const Default: Story = {
  args: {
    title: "Users",
    description: "Manage your team members and their account permissions here.",
    children: (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>Alex Johnson</TableCell>
            <TableCell>Designer</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Jamie Lee</TableCell>
            <TableCell>Developer</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
}

export const WithAction: Story = {
  args: {
    title: "Invoices",
    description: "View and download recent invoices.",
    actions: (
      <button className="text-label-md rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
        Create Invoice
      </button>
    ),
    children: (
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Invoice</TableHeaderCell>
            <TableHeaderCell>Amount</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>#INV-001</TableCell>
            <TableCell>$120.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    ),
  },
}
