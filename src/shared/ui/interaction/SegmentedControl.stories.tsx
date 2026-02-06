import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"
import { SegmentedControl } from "@/shared/ui/interaction/SegmentedControl"
import type { SegmentedControlItem } from "@/shared/ui/interaction/SegmentedControl"
import { RiMoonLine, RiSunLine } from "@/shared/ui/lucide-icons"

type ViewMode = "month" | "week" | "day" | "agenda"

const meta = {
  title: "Interaction/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
} satisfies Meta<typeof SegmentedControl>

export default meta
type Story = StoryObj<typeof meta>

const viewItems: SegmentedControlItem<ViewMode>[] = [
  { value: "month", label: "Bulan", showLeadingIcon: false },
  { value: "week", label: "Minggu", showLeadingIcon: false },
  { value: "day", label: "Hari", showLeadingIcon: false },
  { value: "agenda", label: "Agenda", showLeadingIcon: false },
]

export const Medium: Story = {
  render: () => {
    const [value, setValue] = useState<ViewMode>("week")
    return (
      <SegmentedControl
        items={viewItems}
        value={value}
        onChange={setValue}
        size="md"
        fitContent
      />
    )
  },
}

export const Small: Story = {
  render: () => {
    const [value, setValue] = useState<ViewMode>("week")
    return (
      <SegmentedControl
        items={viewItems}
        value={value}
        onChange={setValue}
        size="sm"
        fitContent
      />
    )
  },
}

export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = useState<"light" | "dark">("light")
    return (
      <SegmentedControl
        value={value}
        onChange={setValue}
        items={[
          { value: "light", label: "Light", icon: RiSunLine },
          { value: "dark", label: "Dark", icon: RiMoonLine },
        ]}
        fitContent
      />
    )
  },
}

export const DisabledItem: Story = {
  render: () => {
    const [value, setValue] = useState<"light" | "dark">("light")
    return (
      <SegmentedControl
        value={value}
        onChange={setValue}
        items={[
          { value: "light", label: "Light", icon: RiSunLine },
          { value: "dark", label: "Dark", icon: RiMoonLine, disabled: true },
        ]}
        fitContent
      />
    )
  },
}
