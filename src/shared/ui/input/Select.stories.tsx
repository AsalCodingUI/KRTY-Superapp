import {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/input/Select"
import { Avatar } from "@/shared/ui"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
  title: "Input/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Small: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[160px]" size="sm">
        <SelectValue placeholder="2025" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="2024">2024</SelectItem>
        <SelectItem value="2025">2025</SelectItem>
        <SelectItem value="2026">2026</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectGroupLabel>North America</SelectGroupLabel>
          <SelectItem value="est">Eastern Standard Time (EST)</SelectItem>
          <SelectItem value="cst">Central Standard Time (CST)</SelectItem>
          <SelectItem value="mst">Mountain Standard Time (MST)</SelectItem>
          <SelectItem value="pst">Pacific Standard Time (PST)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectGroupLabel>Europe</SelectGroupLabel>
          <SelectItem value="gmt">Greenwich Mean Time (GMT)</SelectItem>
          <SelectItem value="cet">Central European Time (CET)</SelectItem>
          <SelectItem value="eet">Eastern European Time (EET)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectGroupLabel>Asia</SelectGroupLabel>
          <SelectItem value="ist">India Standard Time (IST)</SelectItem>
          <SelectItem value="cst_china">China Standard Time (CST)</SelectItem>
          <SelectItem value="jst">Japan Standard Time (JST)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithError: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[220px]" hasError>
        <SelectValue placeholder="Select a status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="inactive">Inactive</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const ProfileList: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select a user" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          value="rezah"
          leadingIcon={<Avatar initials="R" size="xs" color="success" />}
        >
          Option
        </SelectItem>
        <SelectItem
          value="rizal"
          leadingIcon={<Avatar initials="R" size="xs" color="danger" />}
        >
          Option
        </SelectItem>
        <SelectItem
          value="rizki"
          leadingIcon={<Avatar initials="R" size="xs" color="neutral" />}
        >
          Option
        </SelectItem>
        <SelectItem
          value="asal"
          leadingIcon={<Avatar initials="A" size="xs" color="brand" />}
        >
          Option
        </SelectItem>
      </SelectContent>
    </Select>
  ),
}
