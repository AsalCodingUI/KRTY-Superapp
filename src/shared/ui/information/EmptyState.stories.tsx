import { EmptyState } from "@/shared/ui/information/EmptyState"
import { RiFolder3Line } from "@remixicon/react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Information/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "compact"],
    },
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: "No items found",
    description:
      "You have not created any items yet. Start by creating your first item.",
    action: {
      label: "Create Item",
      onClick: () => alert("Clicked!"),
    },
  },
}

export const WithCustomIcon: Story = {
  args: {
    title: "Empty Folder",
    description: "This folder is empty.",
    icon: <RiFolder3Line className="size-12 text-gray-300" />,
  },
}

export const Compact: Story = {
  args: {
    title: "No Data",
    description: "There is no data to display.",
    variant: "compact",
  },
}
