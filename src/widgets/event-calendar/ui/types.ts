export type EventColor =
  | "emerald"
  | "orange"
  | "violet"
  | "blue"
  | "rose"
  | "amber"
  | "cyan"
  | "pink"
  | "teal"
  | "neutral"

export type ViewMode = "month" | "week" | "day" | "agenda" | "timeline"

export interface Guest {
  email: string
  name?: string
  status: "accepted" | "pending" | "declined"
  isOrganizer?: boolean
}

export interface Reminder {
  minutes: number // 10, 30, etc.
}

export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"

export interface RecurrencePattern {
  frequency: RecurrenceFrequency
  interval: number // Every X days/weeks/months
  byWeekDay?: number[] // 0=Sun, 1=Mon, etc.
  byMonthDay?: number // Day of month (1-31)
  count?: number // Number of occurrences
  until?: Date // End date
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  color: EventColor
  location?: string
  allDay?: boolean
  googleEventId?: string
  type?: string
  employeeId?: string // For filtering leave events by employee
  meetingUrl?: string
  guests?: Guest[]
  reminders?: Reminder[]
  rsvpStatus?: "yes" | "no" | "maybe"
  organizer?: string
  // Recurrence fields
  isRecurring?: boolean
  recurrenceRule?: string // RRULE string
  recurrenceId?: string
  parentEventId?: string
  recurrencePattern?: RecurrencePattern // Parsed for UI
}

export interface EventCategory {
  /** The event type it controls (registry value, e.g. "Sharing Santuy"). */
  id: string
  name: string
  color: EventColor
  isActive: boolean
}

export interface CalendarContextValue {
  currentDate: Date
  setCurrentDate: (date: Date) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  selectedDate: Date | null
  setSelectedDate: (date: Date | null) => void
  goToToday: () => void
  goToNext: () => void
  goToPrevious: () => void
}

export interface EventVisibilityContextValue {
  /** Show or hide one category (an event type). */
  toggleCategory: (id: string) => void
  isEventVisible: (event: CalendarEvent) => boolean
  categories: EventCategory[]
}

export interface TimeSlot {
  date: Date
  hour: number
  minute: number
}

export interface DraggedEvent {
  event: CalendarEvent
  originalStart: Date
  originalEnd: Date
}
