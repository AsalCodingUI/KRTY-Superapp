import { AreaChart } from "@/shared/ui/charts/AreaChart"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Charts/AreaChart",
  component: AreaChart,
  tags: ["autodocs"],
} satisfies Meta<typeof AreaChart>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  { date: "Jan 22", SemiAnalysis: 2890, "The Pragmatic Engineer": 2338 },
  { date: "Feb 22", SemiAnalysis: 2756, "The Pragmatic Engineer": 2103 },
  { date: "Mar 22", SemiAnalysis: 3322, "The Pragmatic Engineer": 2194 },
  { date: "Apr 22", SemiAnalysis: 3470, "The Pragmatic Engineer": 2108 },
  { date: "May 22", SemiAnalysis: 3475, "The Pragmatic Engineer": 1812 },
  { date: "Jun 22", SemiAnalysis: 3129, "The Pragmatic Engineer": 1726 },
]

export const Default: Story = {
  args: {
    data: data,
    index: "date",
    categories: ["SemiAnalysis", "The Pragmatic Engineer"],
  },
}

export const WithCustomColors: Story = {
  args: {
    data: data,
    index: "date",
    categories: ["SemiAnalysis", "The Pragmatic Engineer"],
    colors: ["cyan", "indigo"],
  },
}
