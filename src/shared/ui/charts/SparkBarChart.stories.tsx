import { SparkBarChart } from "@/shared/ui/charts/SparkBarChart"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Charts/SparkBarChart",
  component: SparkBarChart,
  tags: ["autodocs"],
} satisfies Meta<typeof SparkBarChart>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  {
    month: "Jan 21",
    Performance: 4000,
  },
  {
    month: "Feb 21",
    Performance: 3000,
  },
  {
    month: "Mar 21",
    Performance: 2000,
  },
  {
    month: "Apr 21",
    Performance: 2780,
  },
  {
    month: "May 21",
    Performance: 1890,
  },
  {
    month: "Jun 21",
    Performance: 2390,
  },
  {
    month: "Jul 21",
    Performance: 3490,
  },
]

export const Default: Story = {
  args: {
    data: data,
    categories: ["Performance"],
    index: "month",
    colors: ["indigo"],
  },
}
