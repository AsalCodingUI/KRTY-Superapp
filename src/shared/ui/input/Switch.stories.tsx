import { Label } from '@/shared/ui/input/Label';
import { Switch } from '@/shared/ui/input/Switch';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Input/Switch',
    component: Switch,
    tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};

export const WithLabel: Story = {
    render: () => (
        <div className="flex items-center gap-2">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
        </div>
    )
};

export const Small: Story = {
    args: {
        size: 'small',
    }
};

export const Disabled: Story = {
    args: {
        disabled: true,
    }
};

export const DisabledChecked: Story = {
    args: {
        disabled: true,
        checked: true,
    }
};
