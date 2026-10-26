import { renderCalendar } from "./render-calendar"

export const dynamic = "force-dynamic"

/** Project calendar (timeline, week, month). */
export default async function CalendarPage() {
  return renderCalendar("project")
}
