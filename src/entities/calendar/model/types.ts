export type EventColor = 'emerald' | 'orange' | 'violet' | 'blue' | 'rose' | 'amber' | 'cyan' | 'neutral'
export type RSVPStatus = 'yes' | 'no' | 'maybe' | 'pending'
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export interface Guest {
    email: string
    name?: string
    status: 'accepted' | 'pending' | 'declined'
    isOrganizer?: boolean
}

export interface Reminder {
    minutes: number
}

export interface RecurrencePattern {
    frequency: RecurrenceFrequency
    interval: number
    byWeekDay?: number[]
    byMonthDay?: number
    count?: number
    until?: Date
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
    employeeId?: string
    meetingUrl?: string
    guests?: Guest[]
    reminders?: Reminder[]
    rsvpStatus?: RSVPStatus
    organizer?: string
    isRecurring?: boolean
    recurrenceRule?: string
    recurrenceId?: string
    parentEventId?: string
    recurrencePattern?: RecurrencePattern
}

export interface EventCategory {
    id: string
    name: string
    color: EventColor
    isActive: boolean
}
