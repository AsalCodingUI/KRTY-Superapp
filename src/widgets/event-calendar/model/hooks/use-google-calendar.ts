import { useContext } from "react"
import { GoogleCalendarContext } from "../google-calendar-context"

export function useGoogleCalendar() {
  const context = useContext(GoogleCalendarContext)

  if (context === undefined) {
    throw new Error(
      "useGoogleCalendar must be used within a GoogleCalendarProvider",
    )
  }

  return context
}
