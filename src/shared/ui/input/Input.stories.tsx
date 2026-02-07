import { Input } from "@/shared/ui/input/Input"
import { RiMailLine } from "@/shared/ui/lucide-icons"
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
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-foreground-secondary">
        <RiMailLine size={20} />
      </div>
      <Input
        {...args}
        className="pl-[calc(var(--padding-lg)+20px+var(--gap-md))]"
      />
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

export const Small: Story = {
  args: {
    inputSize: "sm",
    placeholder: "Small input",
  },
}

export const Large: Story = {
  args: {
    inputSize: "lg",
    placeholder: "Large input",
  },
}
