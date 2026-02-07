import { DataTableRowActions } from "@/shared/ui/data/DataTableRowActions"
import { RiEyeLine, RiPencilLine, RiDeleteBinLine } from "@/shared/ui/lucide-icons"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Data/DataTableRowActions",
  component: DataTableRowActions,
  tags: ["autodocs"],
} satisfies Meta<typeof DataTableRowActions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    actions: [
      { label: "View", onClick: () => {}, icon: <RiEyeLine className="size-4" /> },
      { label: "Edit", onClick: () => {}, icon: <RiPencilLine className="size-4" /> },
      {
        label: "Delete",
        onClick: () => {},
        icon: <RiDeleteBinLine className="size-4" />,
        destructive: true,
      },
    ],
  },
}

export const WithDisabledAction: Story = {
  args: {
    actions: [
      { label: "Edit", onClick: () => {}, icon: <RiPencilLine className="size-4" /> },
      { label: "Delete", onClick: () => {}, icon: <RiDeleteBinLine className="size-4" />, disabled: true },
    ],
  },
}
