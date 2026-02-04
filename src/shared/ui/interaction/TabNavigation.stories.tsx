import {
  TabNavigation,
  TabNavigationLink,
} from "@/shared/ui/interaction/TabNavigation"
import { RiFlowerFill } from "@remixicon/react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Interaction/TabNavigation",
  component: TabNavigation,
  tags: ["autodocs"],
} satisfies Meta<typeof TabNavigation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <TabNavigation>
      <TabNavigationLink href="#" active leadingIcon={<RiFlowerFill />}>
        Overview
      </TabNavigationLink>
      <TabNavigationLink href="#" leadingIcon={<RiFlowerFill />}>
        Details
      </TabNavigationLink>
      <TabNavigationLink href="#" leadingIcon={<RiFlowerFill />} badge="2">
        Settings
      </TabNavigationLink>
      <TabNavigationLink href="#" disabled>
        Disabled
      </TabNavigationLink>
    </TabNavigation>
  ),
}
