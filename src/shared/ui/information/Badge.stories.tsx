import { Badge } from "@/shared/ui/information/Badge"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Information/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "zinc",
        "success",
        "error",
        "warning",
        "info",
        "continue",
        "start",
        "stop",
        "active",
        "inactive",
      ],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    useDefaultIcons: {
      control: "boolean",
    },
    showLeadingIcon: {
      control: "boolean",
    },
    showTrailingIcon: {
      control: "boolean",
    },
    leadingIcon: {
      control: false,
    },
    trailingIcon: {
      control: false,
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
}

export const StatusVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">Success</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="zinc">Zinc</Badge>
    </div>
  ),
}

export const FigmaSubtle: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Badge variant="info" useDefaultIcons>
        Label
      </Badge>
      <Badge variant="success" useDefaultIcons>
        Label
      </Badge>
      <Badge variant="error" useDefaultIcons>
        Label
      </Badge>
      <Badge variant="warning" useDefaultIcons>
        Label
      </Badge>
      <Badge variant="default" useDefaultIcons>
        Label
      </Badge>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm" variant="success">
        Small
      </Badge>
      <Badge size="md" variant="success">
        Medium
      </Badge>
      <Badge size="lg" variant="success">
        Large
      </Badge>
    </div>
  ),
}
