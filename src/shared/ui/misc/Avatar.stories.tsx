import { Avatar, AvatarGroup, AvatarOverflow } from '@/shared/ui/misc/Avatar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Misc/Avatar',
    component: Avatar,
    tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        alt: 'Avatar User',
    },
};

export const Initials: Story = {
    args: {
        initials: 'JD',
        color: 'chart1',
    },
};

export const Group: Story = {
    render: () => (
        <AvatarGroup>
            <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
            <Avatar src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
            <AvatarOverflow count={3} />
        </AvatarGroup>
    )
}
