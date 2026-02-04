import { Button } from '@/shared/ui';
import { PageHeader } from '@/shared/ui/structure/PageHeader';
import { RiAddLine, RiArrowLeftLine, RiDownloadLine } from '@remixicon/react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Structure/PageHeader',
    component: PageHeader,
    tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Dashboard',
        description: 'Overview of your key metrics and performance.',
    },
};

export const WithActions: Story = {
    args: {
        title: 'Projects',
        description: 'Manage and track your ongoing projects.',
        actions: (
            <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                    <RiDownloadLine className="size-4 mr-1" />
                    Export
                </Button>
                <Button size="sm">
                    <RiAddLine className="size-4 mr-1" />
                    New Project
                </Button>
            </div>
        )
    },
};

export const WithBackButton: Story = {
    args: {
        title: 'Project Details',
        description: 'Q1 Marketing Campaign',
        backButton: (
            <Button variant="ghost" size="xs" className="mr-2">
                <RiArrowLeftLine className="size-5" />
            </Button>
        )
    },
};
