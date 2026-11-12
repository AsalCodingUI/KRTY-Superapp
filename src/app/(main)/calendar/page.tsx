import { renderCalendar } from "./render-calendar"

export const dynamic = "force-dynamic"

/** The calendar (timeline, week, month): yours and the team's. */
export default async function CalendarPage() {
  return renderCalendar()
}
