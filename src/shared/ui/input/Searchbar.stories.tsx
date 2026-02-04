import { Searchbar } from '@/shared/ui/input/Searchbar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Input/Searchbar',
    component: Searchbar,
    tags: ['autodocs'],
} satisfies Meta<typeof Searchbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        placeholder: 'Search...',
    },
};
