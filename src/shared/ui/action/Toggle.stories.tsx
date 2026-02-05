import { Toggle, ToggleGroup, ToggleGroupItem } from "@/shared/ui/action/Toggle"
import {
  RiAlignCenter,
  RiAlignLeft,
  RiAlignRight,
  RiBold,
  RiItalic,
  RiUnderline,
} from "@/shared/ui/lucide-icons"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Action/Toggle",
  component: Toggle,
  tags: ["autodocs"],
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Single: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold">
      <RiBold className="size-4" />
    </Toggle>
  ),
}

export const GroupSingleSelection: Story = {
  render: () => (
    <ToggleGroup type="single" defaultValue="left">
      <ToggleGroupItem value="left" aria-label="Align left">
        <RiAlignLeft className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <RiAlignCenter className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <RiAlignRight className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}

export const GroupMultipleSelection: Story = {
  render: () => (
    <ToggleGroup type="multiple">
      <ToggleGroupItem value="bold" aria-label="Toggle bold">
        <RiBold className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic">
        <RiItalic className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Toggle underline">
        <RiUnderline className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
}
