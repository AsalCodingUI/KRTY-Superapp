import { Button } from "@/shared/ui/action/Button"
import { ButtonGroup } from "@/shared/ui/action/ButtonGroup"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Action/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ButtonGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: [
      <Button key="1">Left</Button>,
      <Button key="2">Middle</Button>,
      <Button key="3">Right</Button>,
    ],
  },
  render: (args) => <ButtonGroup {...args} />,
}

export const Primary: Story = {
  args: {
    variant: "primary",
    children: [
      <Button key="1">Left</Button>,
      <Button key="2">Middle</Button>,
      <Button key="3">Right</Button>,
    ],
  },
  render: (args) => <ButtonGroup {...args} />,
}

export const Small: Story = {
  args: {
    size: "sm",
    children: [
      <Button key="1">Left</Button>,
      <Button key="2">Middle</Button>,
      <Button key="3">Right</Button>,
    ],
  },
  render: (args) => <ButtonGroup {...args} />,
}

export const IconOnly: Story = {
  args: {
    children: [
      <Button key="1">1</Button>,
      <Button key="2">2</Button>,
      <Button key="3">3</Button>,
      <Button key="4">4</Button>,
    ],
  },
  render: (args) => <ButtonGroup {...args} />,
}
