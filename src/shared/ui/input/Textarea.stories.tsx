import { Textarea } from '@/shared/ui/input/Textarea';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Input/Textarea',
    component: Textarea,
    tags: ['autodocs'],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: 'Type your message here...',
    },
};

export const Disabled: Story = {
    args: {
        placeholder: 'This is disabled',
        disabled: true,
    },
};

export const WithError: Story = {
    args: {
        hasError: true,
        defaultValue: 'Invalid input value',
    },
};
