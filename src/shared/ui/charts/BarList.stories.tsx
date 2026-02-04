import { BarList } from '@/shared/ui/charts/BarList';
import { RiGithubFill, RiGoogleFill, RiTwitterFill } from '@remixicon/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Charts/BarList',
    component: BarList,
    tags: ['autodocs'],
} satisfies Meta<typeof BarList>;

export default meta;
type Story = StoryObj<typeof meta>;

const data = [
    { name: 'Twitter', value: 456, icon: RiTwitterFill, href: '#' },
    { name: 'Google', value: 351, icon: RiGoogleFill, href: '#' },
    { name: 'GitHub', value: 271, icon: RiGithubFill, href: '#' },
    { name: 'Reddit', value: 191, href: '#' },
    { name: 'Youtube', value: 91, href: '#' },
];

export const Default: Story = {
    args: {
        data: data,
        className: 'mt-2',
    },
};

export const WithCustomColor: Story = {
    args: {
        data: data,
        color: 'pink',
    },
};
