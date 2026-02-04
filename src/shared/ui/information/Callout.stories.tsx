import { Callout } from '@/shared/ui/information/Callout';
import { RiCheckLine, RiErrorWarningLine, RiInformationLine } from '@remixicon/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Information/Callout',
    component: Callout,
    tags: ['autodocs'],
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Information',
        children: 'This is a callout component used to highlight important information.',
        icon: RiInformationLine,
        variant: 'default',
    },
};

export const Success: Story = {
    args: {
        title: 'Success',
        children: 'Operation completed successfully.',
        icon: RiCheckLine,
        variant: 'success',
    },
};

export const Error: Story = {
    args: {
        title: 'Error',
        children: 'Something went wrong. Please try again.',
        icon: RiErrorWarningLine,
        variant: 'error',
    },
};

export const Warning: Story = {
    args: {
        title: 'Warning',
        children: 'This action is irreversible.',
        icon: RiErrorWarningLine,
        variant: 'warning',
    },
};
