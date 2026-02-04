import { Input } from '@/shared/ui/input/Input';
import { Label } from '@/shared/ui/input/Label';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Input/Label',
    component: Label,
    tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: 'Email Address',
        htmlFor: 'email',
    },
    render: (args) => (
        <div className="grid w-full max-w-sm gap-1.5">
            <Label {...args} />
            <Input id="email" type="email" placeholder="Email" />
        </div>
    )
};

export const Disabled: Story = {
    args: {
        children: 'Disabled Label',
        disabled: true
    }
};
