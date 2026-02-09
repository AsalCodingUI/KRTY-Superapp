import { Searchbar } from "@/shared/ui/input/Searchbar"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Input/Searchbar",
  component: Searchbar,
  tags: ["autodocs"],
  argTypes: {
    inputSize: {
      control: "select",
      options: ["sm", "default"],
    },
    disabled: { control: "boolean" },
    hasError: { control: "boolean" },
  },
} satisfies Meta<typeof Searchbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: "Search...",
  },
}

export const Disabled: Story = {
  args: {
    placeholder: "Search...",
    disabled: true,
  },
}

export const WithError: Story = {
  args: {
    placeholder: "Search...",
    hasError: true,
  },
}
