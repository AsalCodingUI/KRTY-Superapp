import { TabNavigation, TabNavigationLink } from '@/shared/ui/interaction/TabNavigation';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Interaction/TabNavigation',
    component: TabNavigation,
    tags: ['autodocs'],
} satisfies Meta<typeof TabNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <TabNavigation>
            <TabNavigationLink href="#" active>
                Overview
            </TabNavigationLink>
            <TabNavigationLink href="#">
                Details
            </TabNavigationLink>
            <TabNavigationLink href="#">
                Settings
            </TabNavigationLink>
            <TabNavigationLink href="#" disabled>
                Disabled
            </TabNavigationLink>
        </TabNavigation>
    ),
};
