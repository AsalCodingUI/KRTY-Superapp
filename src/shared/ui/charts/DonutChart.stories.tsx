import { DonutChart } from "@/shared/ui/charts/DonutChart"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Charts/DonutChart",
  component: DonutChart,
  tags: ["autodocs"],
} satisfies Meta<typeof DonutChart>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  {
    name: "New York",
    sales: 9800,
  },
  {
    name: "London",
    sales: 4567,
  },
  {
    name: "Hong Kong",
    sales: 3908,
  },
  {
    name: "San Francisco",
    sales: 2400,
  },
  {
    name: "Singapore",
    sales: 1908,
  },
  {
    name: "Zurich",
    sales: 1398,
  },
]

export const Default: Story = {
  args: {
    data: data,

    value: "sales",
    category: "name",
    valueFormatter: (val: number) => `$${val}`,
  },
}

export const PieVariant: Story = {
  args: {
    data: data,
    category: "name",
    value: "sales",
    variant: "pie",
  },
}
