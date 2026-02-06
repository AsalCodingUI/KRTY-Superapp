import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { EventItem } from "@/widgets/event-calendar/ui/event-item"
import type { CalendarEvent } from "@/widgets/event-calendar/ui/types"

const meta = {
  title: "Calendar/EventItem",
  component: EventItem,
  tags: ["autodocs"],
  argTypes: {
    compact: { control: "boolean" },
    showTime: { control: "boolean" },
    onClick: { control: false },
    event: { control: false },
  },
} satisfies Meta<typeof EventItem>

export default meta
type Story = StoryObj<typeof meta>

const createEvent = (overrides: Partial<CalendarEvent>): CalendarEvent => ({
  id: overrides.id ?? "1",
  title: overrides.title ?? "30 Min Meeting",
  start: overrides.start ?? new Date("2026-02-06T09:30:00"),
  end: overrides.end ?? new Date("2026-02-06T10:00:00"),
  color: overrides.color ?? "blue",
  description: overrides.description,
  location: overrides.location,
  allDay: overrides.allDay,
  meetingUrl: overrides.meetingUrl,
  guests: overrides.guests,
  reminders: overrides.reminders,
  rsvpStatus: overrides.rsvpStatus,
  organizer: overrides.organizer,
  type: overrides.type,
  employeeId: overrides.employeeId,
  googleEventId: overrides.googleEventId,
  isRecurring: overrides.isRecurring,
  recurrenceRule: overrides.recurrenceRule,
  recurrenceId: overrides.recurrenceId,
  parentEventId: overrides.parentEventId,
  recurrencePattern: overrides.recurrencePattern,
})

export const CompactDefault: Story = {
  args: {
    compact: true,
    showTime: true,
    event: createEvent({}),
  },
}

export const CompactColors: Story = {
  render: () => (
    <div className="space-y-2">
      <EventItem compact showTime event={createEvent({ id: "b", color: "blue", title: "09:30 Meeting" })} />
      <EventItem compact showTime event={createEvent({ id: "g", color: "emerald", title: "Company Update" })} />
      <EventItem compact showTime event={createEvent({ id: "y", color: "amber", title: "Urgent Review" })} />
      <EventItem compact showTime event={createEvent({ id: "r", color: "rose", title: "Leave Approval" })} />
      <EventItem compact showTime event={createEvent({ id: "n", color: "neutral", title: "Reminder" })} />
    </div>
  ),
}

export const FullCard: Story = {
  args: {
    compact: false,
    showTime: true,
    event: createEvent({
      id: "full",
      title: "Design Sync",
      description: "Review layout, spacing, and finalize components.",
      location: "Meeting Room A",
    }),
  },
}

export const FullNoTime: Story = {
  args: {
    compact: false,
    showTime: false,
    event: createEvent({
      id: "full-2",
      title: "All Hands Update",
      description: "Company-wide updates and Q&A.",
      allDay: true,
    }),
  },
}
