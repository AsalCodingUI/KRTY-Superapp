import { Tracker } from '@/shared/ui/progress/Tracker';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Progress/Tracker',
    component: Tracker,
    tags: ['autodocs'],
} satisfies Meta<typeof Tracker>;

export default meta;
type Story = StoryObj<typeof meta>;

const data = [
    { color: 'bg-emerald-500', tooltip: 'Operational' },
    { color: 'bg-emerald-500', tooltip: 'Operational' },
    { color: 'bg-emerald-500', tooltip: 'Operational' },
    { color: 'bg-amber-500', tooltip: 'Degraded' },
    { color: 'bg-emerald-500', tooltip: 'Operational' },
    { color: 'bg-emerald-500', tooltip: 'Operational' },
    { color: 'bg-rose-500', tooltip: 'Downtime' },
    { color: 'bg-emerald-500', tooltip: 'Operational' },
    { color: 'bg-emerald-500', tooltip: 'Operational' },
    { color: 'bg-emerald-500', tooltip: 'Operational' },
];

export const Default: Story = {
    args: {
        data: data,
        hoverEffect: true,
    },
};
