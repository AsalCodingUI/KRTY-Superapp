import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ArrowAnimated } from "./ArrowAnimated"

const meta: Meta<typeof ArrowAnimated> = {
  title: "Shared/UI/Icons/ArrowAnimated",
  component: ArrowAnimated,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof ArrowAnimated>

export const Default: Story = {
  args: {},
}

export const CustomClass: Story = {
  args: {
    className: "text-primary w-12 h-12",
  },
}
