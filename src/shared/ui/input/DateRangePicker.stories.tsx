import { DateRangePicker } from "@/shared/ui/input/DateRangePicker"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { addDays } from "date-fns"
import { useState } from "react"
import { DateRange } from "react-day-picker"

const meta = {
  title: "Input/DateRangePicker",
  component: DateRangePicker,
  tags: ["autodocs"],
} satisfies Meta<typeof DateRangePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<DateRange | undefined>({
      from: new Date(),
      to: addDays(new Date(), 7),
    })
    return (
      <div className="w-full max-w-sm">
        <DateRangePicker value={value} onValueChange={setValue} />
      </div>
    )
  },
}

export const Empty: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <DateRangePicker />
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <DateRangePicker disabled />
    </div>
  ),
}
