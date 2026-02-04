import { Heading, Text, Title } from '@/shared/ui/misc/Typography';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Misc/Typography',
    component: Text, // Just using Text as the main component for the meta, but showing all in stories
    tags: ['autodocs'],
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <div className="space-y-4">
            <div>
                <span className="text-xs text-slate-400 block mb-1">Heading</span>
                <Heading>The quick brown fox jumps over the lazy dog</Heading>
            </div>
            <div>
                <span className="text-xs text-slate-400 block mb-1">Title</span>
                <Title>The quick brown fox jumps over the lazy dog</Title>
            </div>
            <div>
                <span className="text-xs text-slate-400 block mb-1">Text</span>
                <Text>The quick brown fox jumps over the lazy dog</Text>
            </div>
        </div>
    )
};
