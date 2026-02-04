import { RadarChart } from "@/shared/ui/charts/RadarChart"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Charts/RadarChart",
  component: RadarChart,
  tags: ["autodocs"],
} satisfies Meta<typeof RadarChart>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  {
    subject: "Math",
    A: 120,
    B: 110,
    fullMark: 150,
  },
  {
    subject: "Chinese",
    A: 98,
    B: 130,
    fullMark: 150,
  },
  {
    subject: "English",
    A: 86,
    B: 130,
    fullMark: 150,
  },
  {
    subject: "Geography",
    A: 99,
    B: 100,
    fullMark: 150,
  },
  {
    subject: "Physics",
    A: 85,
    B: 90,
    fullMark: 150,
  },
  {
    subject: "History",
    A: 65,
    B: 85,
    fullMark: 150,
  },
]

export const Default: Story = {
  args: {
    data: data,
    index: "subject",
    categories: ["A", "B"],
    valueFormatter: (val: number) => `${val}`,
  },
}

export const WithCustomColors: Story = {
  args: {
    data: data,
    index: "subject",
    categories: ["A", "B"],
    colors: ["indigo", "pink"],
  },
}
