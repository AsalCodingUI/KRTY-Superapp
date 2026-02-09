import { TextInput } from "@/shared/ui/input/TextInput"
import {
  RiMailLine,
  RiExternalLinkLine,
  RiCalendar2Fill,
  RiTimeLine,
} from "@/shared/ui/lucide-icons"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

const meta = {
  title: "Input/TextInput",
  component: TextInput,
  tags: ["autodocs"],
  argTypes: {
    inputSize: {
      control: "select",
      options: ["sm", "default"],
    },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
    isLoading: { control: "boolean" },
  },
} satisfies Meta<typeof TextInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: "Placeholder text...",
  },
}

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
}

export const WithIcon: Story = {
  args: {
    leadingIcon: RiMailLine,
    placeholder: "Email address",
  },
}

export const WithTrailingIcon: Story = {
  args: {
    trailingIcon: RiExternalLinkLine,
    placeholder: "Website",
  },
}

export const WithPrefix: Story = {
  args: {
    prefix: "$",
    placeholder: "Amount",
  },
}

export const WithSuffix: Story = {
  args: {
    placeholder: "Amount",
    suffix: "USD",
  },
}

export const WithPrefixAndSuffix: Story = {
  args: {
    prefix: "https://",
    suffix: ".com",
    placeholder: "domain",
  },
}

export const WithPrefixAndIcon: Story = {
  args: {
    prefix: "$",
    leadingIcon: RiMailLine,
    placeholder: "Amount",
  },
}

export const WithClearButton: Story = {
  render: (args) => {
    const [value, setValue] = useState("Some text")
    return (
      <TextInput
        {...args}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue("")}
        placeholder="Type to clear..."
      />
    )
  },
}

export const Loading: Story = {
  args: {
    placeholder: "Searching...",
    isLoading: true,
  },
}

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
}

export const WithError: Story = {
  args: {
    error: true,
    errorMessage: "Invalid email address",
    placeholder: "Email",
    defaultValue: "invalid-email",
  },
}

export const WithHelperText: Story = {
  args: {
    helperText: "This is a hint text to help user.",
    placeholder: "Input with helper",
  },
}

export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
}

export const Date: Story = {
  args: {
    type: "date",
    placeholder: "Select date",
    trailingIcon: RiCalendar2Fill,
  },
}

export const Time: Story = {
  args: {
    type: "time",
    placeholder: "Select time",
    trailingIcon: RiTimeLine,
  },
}

export const Small: Story = {
  args: {
    inputSize: "sm",
    placeholder: "Small input",
  },
}
