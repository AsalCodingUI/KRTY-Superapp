import { Checkbox } from "@/shared/ui/input/Checkbox"
import { Label } from "@/shared/ui/input/Label"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Input/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: "checkbox_1",
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} />
      <Label htmlFor="checkbox_1">Accept terms and conditions</Label>
    </div>
  ),
}

export const Checked: Story = {
  args: {
    id: "checkbox_2",
    checked: true,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} />
      <Label htmlFor="checkbox_2">Checked options</Label>
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    id: "checkbox_3",
    disabled: true,
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} />
      <Label htmlFor="checkbox_3" disabled>
        Disabled option
      </Label>
    </div>
  ),
}

export const Indeterminate: Story = {
  args: {
    id: "checkbox_4",
    checked: "indeterminate",
  },
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox {...args} />
      <Label htmlFor="checkbox_4">Indeterminate state</Label>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox_state_1" />
        <Label htmlFor="checkbox_state_1">Unchecked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox_state_2" checked />
        <Label htmlFor="checkbox_state_2">Checked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox_state_3" checked="indeterminate" />
        <Label htmlFor="checkbox_state_3">Indeterminate</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox_state_4" disabled />
        <Label htmlFor="checkbox_state_4" disabled>
          Unchecked Disabled
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox_state_5" checked disabled />
        <Label htmlFor="checkbox_state_5" disabled>
          Checked Disabled
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox_state_6" checked="indeterminate" disabled />
        <Label htmlFor="checkbox_state_6" disabled>
          Indeterminate Disabled
        </Label>
      </div>
    </div>
  ),
}
