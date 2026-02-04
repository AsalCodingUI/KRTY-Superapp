import { LineChart } from "@/shared/ui/charts/LineChart"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Charts/LineChart",
  component: LineChart,
  tags: ["autodocs"],
} satisfies Meta<typeof LineChart>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  {
    year: 1970,
    "Export Growth": 2.04,
    "Import Growth": 1.53,
  },
  {
    year: 1971,
    "Export Growth": 1.96,
    "Import Growth": 1.58,
  },
  {
    year: 1972,
    "Export Growth": 1.96,
    "Import Growth": 1.61,
  },
  {
    year: 1973,
    "Export Growth": 1.93,
    "Import Growth": 1.61,
  },
  {
    year: 1974,
    "Export Growth": 1.88,
    "Import Growth": 1.67,
  },
]

export const Default: Story = {
  args: {
    data: data,
    index: "year",
    categories: ["Export Growth", "Import Growth"],
    valueFormatter: (number: number) =>
      `${Intl.NumberFormat("us").format(number).toString()}%`,
  },
}

export const WithCustomColors: Story = {
  args: {
    data: data,
    index: "year",
    categories: ["Export Growth", "Import Growth"],
    colors: ["emerald", "pink"],
  },
}
