import { RadioCardGroup, RadioCardItem } from '@/shared/ui/input/RadioCard';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Input/RadioCard',
    component: RadioCardGroup,
    tags: ['autodocs'],
} satisfies Meta<typeof RadioCardGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => (
        <RadioCardGroup defaultValue="1" className="grid-cols-2">
            <RadioCardItem value="1">
                <div className="flex flex-col gap-2">
                    <span className="font-medium">Startup</span>
                    <span className="text-content-subtle text-sm">For small businesses</span>
                </div>
            </RadioCardItem>
            <RadioCardItem value="2">
                <div className="flex flex-col gap-2">
                    <span className="font-medium">Enterprise</span>
                    <span className="text-content-subtle text-sm">For large organizations</span>
                </div>
            </RadioCardItem>
        </RadioCardGroup>
    )
};
