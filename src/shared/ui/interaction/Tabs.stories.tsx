import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/interaction/Tabs"
import { RiFlowerFill } from "@/shared/ui/lucide-icons"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Interaction/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  argTypes: {
    // variant: { control: 'select', options: ['line', 'solid'] } // Applied to TabsList context actually
  },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const BasicLine: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div className="mt-2 rounded-md border p-4">
          <h3 className="font-semibold">Account</h3>
          <p className="text-label-md text-content-subtle">
            Make changes to your account here.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="mt-2 rounded-md border p-4">
          <h3 className="font-semibold">Password</h3>
          <p className="text-label-md text-content-subtle">
            Change your password here.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
}

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
}

export const FigmaLine: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[420px]">
      <TabsList>
        <TabsTrigger
          value="tab1"
          leadingIcon={<RiFlowerFill />}
          badge="2"
        >
          Label 1
        </TabsTrigger>
        <TabsTrigger value="tab2" leadingIcon={<RiFlowerFill />}>
          Label 2
        </TabsTrigger>
        <TabsTrigger value="tab3" leadingIcon={<RiFlowerFill />}>
          Label 3
        </TabsTrigger>
      </TabsList>
      <TabsContent value="tab1" className="mt-2">
        Tab 1 content
      </TabsContent>
      <TabsContent value="tab2" className="mt-2">
        Tab 2 content
      </TabsContent>
      <TabsContent value="tab3" className="mt-2">
        Tab 3 content
      </TabsContent>
    </Tabs>
  ),
}
