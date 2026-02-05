import { Label } from "@/shared/ui/input/Label"
import { RadioGroup, RadioGroupItem } from "@/shared/ui/input/RadioGroup"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Input/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="option1" />
        <Label htmlFor="option1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="option2" />
        <Label htmlFor="option2">Option 2</Label>
      </div>
    </RadioGroup>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <RadioGroup defaultValue="radio_state_1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="radio_state_1" id="radio_state_1" />
          <Label htmlFor="radio_state_1">Unchecked</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="radio_state_2" id="radio_state_2" />
          <Label htmlFor="radio_state_2">Option</Label>
        </div>
      </RadioGroup>

      <RadioGroup defaultValue="radio_state_disabled_1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="radio_state_disabled_1"
            id="radio_state_disabled_1"
            disabled
          />
          <Label htmlFor="radio_state_disabled_1" disabled>
            Disabled Unchecked
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem
            value="radio_state_disabled_2"
            id="radio_state_disabled_2"
            disabled
          />
          <Label htmlFor="radio_state_disabled_2" disabled>
            Disabled Checked
          </Label>
        </div>
      </RadioGroup>
    </div>
  ),
}
