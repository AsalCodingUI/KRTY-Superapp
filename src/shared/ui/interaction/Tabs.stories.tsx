import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/interaction/Tabs';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
    title: 'Interaction/Tabs',
    component: Tabs,
    tags: ['autodocs'],
    argTypes: {
        // variant: { control: 'select', options: ['line', 'solid'] } // Applied to TabsList context actually
    }
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicLine: Story = {
    render: () => (
        <Tabs defaultValue="account" className="w-[400px]">
            <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
                <div className="p-4 border rounded-md mt-2">
                    <h3 className="font-semibold">Account</h3>
                    <p className="text-sm text-content-subtle">Make changes to your account here.</p>
                </div>
            </TabsContent>
            <TabsContent value="password">
                <div className="p-4 border rounded-md mt-2">
                    <h3 className="font-semibold">Password</h3>
                    <p className="text-sm text-content-subtle">Change your password here.</p>
                </div>
            </TabsContent>
        </Tabs>
    ),
};

export const SolidVariant: Story = {
    render: () => (
        <Tabs defaultValue="music" className="w-[400px]">
            <TabsList variant="solid">
                <TabsTrigger value="music">Music</TabsTrigger>
                <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
            </TabsList>
            <TabsContent value="music" className="mt-2">
                Music content
            </TabsContent>
            <TabsContent value="podcasts" className="mt-2">
                Podcast content
            </TabsContent>
            <TabsContent value="live" className="mt-2">
                Live content
            </TabsContent>
        </Tabs>
    ),
};
