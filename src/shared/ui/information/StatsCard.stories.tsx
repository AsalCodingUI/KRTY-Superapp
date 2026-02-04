import { StatsCard } from '@/shared/ui/information/StatsCard';
import { RiMoneyDollarCircleLine, RiUserLine } from '@remixicon/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Information/StatsCard',
    component: StatsCard,
    tags: ['autodocs'],
} satisfies Meta<typeof StatsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Total Revenue',
        value: '$12,345',
        description: 'Compared to last month',
        trend: { value: '+12%', direction: 'up' },
        icon: <RiMoneyDollarCircleLine className="size-5" />
    },
};

export const NegativeTrend: Story = {
    args: {
        title: 'Active Users',
        value: '1,234',
        description: 'Compared to yesterday',
        trend: { value: '-5%', direction: 'down' },
        icon: <RiUserLine className="size-5" />
    },
};

export const NeutralTrend: Story = {
    args: {
        title: 'Bounce Rate',
        value: '45%',
        description: 'Compared to last week',
        trend: { value: '0%', direction: 'neutral' },
    },
};
