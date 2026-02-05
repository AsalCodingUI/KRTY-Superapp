import { RiAddLine, RiArrowRightLine } from "@/shared/ui/lucide-icons"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "./Button"

const meta = {
  title: "Shared/UI/Action/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "destructive",
        "secondary",
        "tertiary",
        "tertiaryInverse",
        "ghost",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "xs", "icon", "icon-sm", "icon-xs"],
    },
    disabled: {
      control: "boolean",
    },
    isLoading: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
}

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Button",
  },
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Button",
  },
}

export const Tertiary: Story = {
  args: {
    variant: "tertiary",
    children: "Button",
  },
}

/**
 * Visual Audit matching Figma Node 2048:24262
 * Displays all variants (Primary, Destructive, Secondary, Tertiary, Tertiary Inverse)
 * across all sizes (Medium, Small, XSmall) and states (Default, Disabled, Loading).
 */
export const FigmaAudit: Story = {
  render: () => (
    <div className="flex flex-col gap-8 rounded-xl border border-neutral-200 bg-neutral-50 p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid grid-cols-[120px_1fr_1fr_1fr] items-center gap-4">
        <h3 className="font-bold text-neutral-500">Variant</h3>
        <h3 className="text-center font-bold text-neutral-500">
          Medium (Default)
        </h3>
        <h3 className="text-center font-bold text-neutral-500">Small</h3>
        <h3 className="text-center font-bold text-neutral-500">XSmall</h3>

        {/* Primary */}
        <div className="text-label-md text-neutral-700 dark:text-neutral-300">
          Primary
        </div>
        <div className="flex justify-center">
          <Button variant="primary">Button</Button>
        </div>
        <div className="flex justify-center">
          <Button variant="primary" size="sm">
            Button
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="primary" size="xs">
            Button
          </Button>
        </div>

        {/* Destructive */}
        <div className="text-label-md text-neutral-700 dark:text-neutral-300">
          Destructive
        </div>
        <div className="flex justify-center">
          <Button variant="destructive">Button</Button>
        </div>
        <div className="flex justify-center">
          <Button variant="destructive" size="sm">
            Button
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="destructive" size="xs">
            Button
          </Button>
        </div>

        {/* Secondary (Neutral) */}
        <div className="text-label-md text-neutral-700 dark:text-neutral-300">
          Secondary
        </div>
        <div className="flex justify-center">
          <Button variant="secondary">Button</Button>
        </div>
        <div className="flex justify-center">
          <Button variant="secondary" size="sm">
            Button
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="secondary" size="xs">
            Button
          </Button>
        </div>

        {/* Tertiary */}
        <div className="text-label-md text-neutral-700 dark:text-neutral-300">
          Tertiary
        </div>
        <div className="flex justify-center">
          <Button variant="tertiary">Button</Button>
        </div>
        <div className="flex justify-center">
          <Button variant="tertiary" size="sm">
            Button
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="tertiary" size="xs">
            Button
          </Button>
        </div>

        {/* Tertiary Inverse (needs dark bg) */}
        <div className="text-label-md text-neutral-700 dark:text-neutral-300">
          Tertiary Inv.
        </div>
        <div className="flex justify-center rounded bg-black/80 p-2">
          <Button variant="tertiaryInverse">Button</Button>
        </div>
        <div className="flex justify-center rounded bg-black/80 p-2">
          <Button variant="tertiaryInverse" size="sm">
            Button
          </Button>
        </div>
        <div className="flex justify-center rounded bg-black/80 p-2">
          <Button variant="tertiaryInverse" size="xs">
            Button
          </Button>
        </div>
      </div>

      <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />

      <div className="grid grid-cols-[120px_1fr_1fr_1fr] items-center gap-4">
        <h3 className="font-bold text-neutral-500">State</h3>
        <h3 className="text-center font-bold text-neutral-500">Medium</h3>
        <h3 className="text-center font-bold text-neutral-500">Small</h3>
        <h3 className="text-center font-bold text-neutral-500">XSmall</h3>

        {/* Disabled */}
        <div className="text-label-md text-neutral-700 dark:text-neutral-300">
          Disabled
        </div>
        <div className="flex justify-center">
          <Button variant="primary" disabled>
            Button
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="primary" size="sm" disabled>
            Button
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="primary" size="xs" disabled>
            Button
          </Button>
        </div>

        {/* Loading (Labeled) */}
        <div className="text-label-md text-neutral-700 dark:text-neutral-300">
          Loading
        </div>
        <div className="flex justify-center">
          <Button variant="primary" isLoading>
            Button
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="primary" size="sm" isLoading>
            Button
          </Button>
        </div>
        <div className="flex justify-center">
          <Button variant="primary" size="xs" isLoading>
            Button
          </Button>
        </div>
      </div>

      <div className="h-px w-full bg-neutral-200 dark:bg-neutral-800" />

      <div className="grid grid-cols-[120px_1fr_1fr_1fr] items-center gap-4">
        <h3 className="font-bold text-neutral-500">With Icons</h3>
        <h3 className="text-center font-bold text-neutral-500">Leading</h3>
        <h3 className="text-center font-bold text-neutral-500">Trailing</h3>
        <h3 className="text-center font-bold text-neutral-500">Both</h3>

        <div className="text-label-md text-neutral-700 dark:text-neutral-300">
          Primary (Med)
        </div>
        <div className="flex justify-center">
          <Button leadingIcon={<RiAddLine />}>Add Item</Button>
        </div>
        <div className="flex justify-center">
          <Button trailingIcon={<RiArrowRightLine />}>Next</Button>
        </div>
        <div className="flex justify-center">
          <Button
            leadingIcon={<RiAddLine />}
            trailingIcon={<RiArrowRightLine />}
          >
            Action
          </Button>
        </div>
      </div>
    </div>
  ),
}
