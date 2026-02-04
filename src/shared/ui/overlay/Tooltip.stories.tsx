import { Button } from '@/shared/ui/action/Button';
import { Tooltip } from '@/shared/ui/overlay/Tooltip';
import { RiAddLine, RiInformationLine } from '@remixicon/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Overlay/Tooltip',
    component: Tooltip,
    tags: ['autodocs'],
    argTypes: {
        side: {
            control: 'select',
            options: ['top', 'right', 'bottom', 'left'],
        }
    }
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        content: 'Add to library',
        children: (
            <Button size="xs" variant="ghost">
                <RiAddLine className="size-5" />
            </Button>
        )
    },
};

export const WithText: Story = {
    args: {
        content: 'This action cannot be undone',
        side: 'right',
        children: (
            <Button variant="secondary">Delete Account</Button>
        )
    },
};

export const InfoTooltip: Story = {
    args: {
        content: 'Your password must be at least 8 characters long.',
        children: (
            <RiInformationLine className="size-5 text-content-subtle cursor-help" />
        )
    },
};
