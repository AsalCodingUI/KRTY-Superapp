import { Input } from "@/shared/ui/input/Input"
import { RiMailLine } from "@remixicon/react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Input/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    inputSize: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    hasError: { control: "boolean" },
    disabled: { control: "boolean" },
    type: {
      control: "select",
      options: ["text", "password", "email", "number", "search"],
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
}

export const WithIcon: Story = {
  render: (args) => (
    <div className="relative">
      <div className="absolute top-2.5 left-2.5 text-gray-500">
        <RiMailLine size={16} />
      </div>
      <Input {...args} className="pl-9" />
    </div>
  ),
  args: {
    placeholder: "Email address",
    type: "email",
  },
}

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
}

export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
}

export const ErrorState: Story = {
  args: {
    hasError: true,
    defaultValue: "Invalid input",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Disabled input",
  },
}
