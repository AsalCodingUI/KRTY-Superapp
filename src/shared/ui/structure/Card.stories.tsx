import { Button } from '@/shared/ui';
import { Card } from '@/shared/ui/structure/Card';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Structure/Card',
    component: Card,
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <Card className="max-w-sm">
            <h3 className="font-semibold text-lg text-content">Card Title</h3>
            <p className="text-content-subtle mt-2">
                This is a simple card component used to group related content.
            </p>
        </Card>
    ),
};

export const WithFooter: Story = {
    render: () => (
        <Card className="max-w-sm">
            <h3 className="font-semibold text-lg text-content">Notification Settings</h3>
            <p className="text-content-subtle mt-2 mb-4">
                Manage how you receive notifications and alerts.
            </p>
            <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm">Cancel</Button>
                <Button size="sm">Save</Button>
            </div>
        </Card>
    ),
};
