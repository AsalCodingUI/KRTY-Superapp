import { ProgressCircle } from "@/shared/ui/progress/ProgressCircle"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Progress/ProgressCircle",
  component: ProgressCircle,
  tags: ["autodocs"],
} satisfies Meta<typeof ProgressCircle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 40,
  },
}

export const WithValue: Story = {
  args: {
    value: 75,
    variant: "success",
    radius: 40,
    strokeWidth: 6,
    children: <span className="text-label-md text-content">75%</span>,
  },
}

export const Small: Story = {
  args: {
    value: 60,
    radius: 20,
    strokeWidth: 4,
    variant: "warning",
  },
}
