import { Divider } from "@/shared/ui/structure/Divider"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Structure/Divider",
  component: Divider,
  tags: ["autodocs"],
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="max-w-md space-y-4 rounded-md border p-4">
      <p>Section 1 Content</p>
      <Divider />
      <p>Section 2 Content</p>
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="max-w-md space-y-4 rounded-md border p-4">
      <p>Login with email</p>
      <Divider>OR</Divider>
      <p>Login with Google</p>
    </div>
  ),
}
