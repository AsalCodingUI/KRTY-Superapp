import {
  DatePicker,
  DateRangePicker,
} from "@/shared/ui/input/DatePicker"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

const meta = {
  title: "Input/DatePickerWrappers",
  component: DatePicker,
  tags: ["autodocs"],
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date())
    return <DatePicker value={date} onChange={setDate} />
  },
}

export const Range: Story = {
  render: () => {
    const [value, setValue] = useState<any>()
    return <DateRangePicker value={value} onChange={setValue} />
  },
}
