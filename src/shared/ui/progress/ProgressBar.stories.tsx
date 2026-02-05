import { ProgressBar } from "@/shared/ui/progress/ProgressBar"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Progress/ProgressBar",
  component: ProgressBar,
  tags: ["autodocs"],
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 45,
    max: 100,
  },
}

export const WithLabel: Story = {
  args: {
    value: 75,
    label: "75%",
    variant: "success",
  },
}

export const Animated: Story = {
  args: {
    value: 30,
    showAnimation: true,
    variant: "warning",
  },
}

export const TableLabel: Story = {
  args: {
    value: 80,
    label: "80%",
    variant: "brand",
    size: "sm",
    labelTone: "secondary",
    labelSize: "sm",
  },
}
