import { Button } from '@/shared/ui/action/Button';
import { Input } from '@/shared/ui/input/Input';
import { Label } from '@/shared/ui/input/Label';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/overlay/Popover';
import { RiSettings3Line } from '@remixicon/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Overlay/Popover',
    component: Popover,
    tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    render: () => (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="secondary">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
                <div className="space-y-2">
                    <h4 className="font-medium leading-none">Dimensions</h4>
                    <p className="text-sm text-content-subtle">Set the dimensions for the layer.</p>
                </div>
                <div className="grid gap-2 py-4">
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="width">Width</Label>
                        <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="maxWidth">Max. width</Label>
                        <Input id="maxWidth" defaultValue="300px" className="col-span-2 h-8" />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    ),
};

export const WithIcon: Story = {
    render: () => (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="w-10 rounded-full p-0">
                    <RiSettings3Line className="size-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold">Quick Settings</h4>
                </div>
                <div className="space-y-4">
                    {/* Example content */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Notifications</span>
                        <Button size="xs" variant="secondary">Enable</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    ),
};
