import type { Meta, StoryObj } from "@storybook/nextjs-vite"
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
      <div className="text-body-sm rounded-md border border-dashed border-gray-300 p-8 text-center text-gray-500">
        Table Component Placeholder
      </div>
    ),
  },
}

export const WithAction: Story = {
  args: {
    title: "Invoices",
    description: "View and download recent invoices.",
    actions: (
      <button className="text-label-md rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">
        Create Invoice
      </button>
    ),
    children: (
      <div className="text-body-sm rounded-md border border-dashed border-gray-300 p-8 text-center text-gray-500">
        Table Component Placeholder
      </div>
    ),
  },
}
