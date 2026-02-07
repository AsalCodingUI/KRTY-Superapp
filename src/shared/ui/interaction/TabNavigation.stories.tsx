import {
  TabNavigation,
  TabNavigationLink,
} from "@/shared/ui/interaction/TabNavigation"
import { RiFlowerFill } from "@/shared/ui/lucide-icons"
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

export const NoIcons: Story = {
  render: () => (
    <TabNavigation>
      <TabNavigationLink href="#" active showLeadingIcon={false}>
        Overview
      </TabNavigationLink>
      <TabNavigationLink href="#" showLeadingIcon={false}>
        KPI
      </TabNavigationLink>
      <TabNavigationLink href="#" showLeadingIcon={false} badge="3">
        Reviews
      </TabNavigationLink>
    </TabNavigation>
  ),
}

export const WithBadges: Story = {
  render: () => (
    <TabNavigation>
      <TabNavigationLink href="#" active leadingIcon={<RiFlowerFill />} badge="9">
        Unread
      </TabNavigationLink>
      <TabNavigationLink href="#" leadingIcon={<RiFlowerFill />} badge="12">
        All
      </TabNavigationLink>
    </TabNavigation>
  ),
}
