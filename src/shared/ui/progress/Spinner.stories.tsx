import { Spinner } from '@/shared/ui/progress/Spinner';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Progress/Spinner',
    component: Spinner,
    tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        size: 'md',
        variant: 'default',
    },
};

export const Sizes: Story = {
    render: () => (
        <div className="flex items-center gap-4">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
        </div>
    )
};

export const Variants: Story = {
    render: () => (
        <div className="flex items-center gap-4 bg-gray-100 p-4 dark:bg-gray-800">
            <Spinner variant="default" />
            <Spinner variant="primary" />
            <Spinner variant="neutral" />
        </div>
    )
};
