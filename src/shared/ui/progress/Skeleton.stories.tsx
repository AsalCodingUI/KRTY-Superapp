import { Skeleton, SkeletonCard, SkeletonChart, SkeletonList, SkeletonTable } from '@/shared/ui/progress/Skeleton';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Progress/Skeleton',
    component: Skeleton,
    tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    args: {
        className: "h-4 w-[250px]"
    }
};

export const Presets: Story = {
    render: () => (
        <div className="space-y-8 max-w-xl">
            <div className="space-y-4">
                <h3 className="font-medium">Card</h3>
                <SkeletonCard />
            </div>
            <div className="space-y-4">
                <h3 className="font-medium">List</h3>
                <SkeletonList />
            </div>
            <div className="space-y-4">
                <h3 className="font-medium">Table</h3>
                <SkeletonTable />
            </div>
            <div className="space-y-4">
                <h3 className="font-medium">Chart</h3>
                <SkeletonChart />
            </div>
        </div>
    )
};
