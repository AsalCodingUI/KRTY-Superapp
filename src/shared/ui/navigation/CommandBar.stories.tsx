import {
  CommandBar,
  CommandBarBar,
  CommandBarCommand,
  CommandBarSeperator,
  CommandBarValue,
} from "@/shared/ui/navigation/CommandBar"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { useState } from "react"

const meta = {
  title: "Navigation/CommandBar",
  component: CommandBar,
  tags: ["autodocs"],
} satisfies Meta<typeof CommandBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(true)
    return (
      <div className="relative flex h-40 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-900">
        <p className="text-body-sm text-content-subtle">
          Press Cmd+K to open (simulated)
        </p>
        <CommandBar open={isOpen} onOpenChange={setIsOpen}>
          <CommandBarBar>
            <CommandBarValue>Select Action</CommandBarValue>
            <CommandBarSeperator />
            <CommandBarCommand
              label="Copy"
              action={() => alert("Copied")}
              shortcut={{ shortcut: "c", label: "C" }}
            />
            <CommandBarCommand
              label="Paste"
              action={() => alert("Pasted")}
              shortcut={{ shortcut: "v", label: "V" }}
            />
          </CommandBarBar>
        </CommandBar>
      </div>
    )
  },
}
