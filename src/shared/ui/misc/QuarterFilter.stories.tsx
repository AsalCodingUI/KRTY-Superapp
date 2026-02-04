import { QuarterFilter } from "@/shared/ui/misc/QuarterFilter"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

const meta = {
  title: "Misc/QuarterFilter",
  component: QuarterFilter,
  tags: ["autodocs"],
} satisfies Meta<typeof QuarterFilter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("2025-Q1")
    return <QuarterFilter value={value} onChange={setValue} />
  },
}

export const WithoutYear: Story = {
  render: () => {
    const [value, setValue] = useState("2025-Q1")
    return <QuarterFilter value={value} onChange={setValue} showYear={false} />
  },
}
