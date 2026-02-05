import { Label } from "@/shared/ui/input/Label"
import { Switch } from "@/shared/ui/input/Switch"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Input/Switch",
  component: Switch,
  tags: ["autodocs"],
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
}

export const Small: Story = {
  args: {
    size: "small",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
  },
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Switch id="switch_state_1" />
        <Label htmlFor="switch_state_1">Off</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch_state_2" checked />
        <Label htmlFor="switch_state_2">On</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch_state_3" disabled />
        <Label htmlFor="switch_state_3" disabled>
          Disabled Off
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="switch_state_4" checked disabled />
        <Label htmlFor="switch_state_4" disabled>
          Disabled On
        </Label>
      </div>
    </div>
  ),
}
