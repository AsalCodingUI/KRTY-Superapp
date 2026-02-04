import { CategoryBar } from '@/shared/ui/charts/CategoryBar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Charts/CategoryBar',
    component: CategoryBar,
    tags: ['autodocs'],
} satisfies Meta<typeof CategoryBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        values: [40, 30, 20, 10],
        colors: ['emerald', 'amber', 'amber', 'pink'],
    },
};

export const WithLabels: Story = {
    args: {
        values: [10, 25, 45, 20],
        colors: ['cyan', 'blue', 'indigo', 'violet'],
        showLabels: true,
    },
};
