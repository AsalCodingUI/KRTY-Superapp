import { notFound } from "next/navigation"
import { renderCalendar } from "../render-calendar"

/** /calendar/<view> and /calendar/personal[/<view>]; anything else 404s. */
const PROJECT_VIEWS = ["timeline", "week", "month"]
const PERSONAL_VIEWS = ["week", "month"]

export const dynamic = "force-dynamic"

export default async function CalendarTabPage({
  params,
}: {
  params: Promise<{ tab: string[] }>
}) {
  const { tab } = await params
  const personal = tab[0] === "personal"
  const view = personal ? tab[1] : tab[0]
  const views = personal ? PERSONAL_VIEWS : PROJECT_VIEWS
  if (tab.length > (personal ? 2 : 1) || (view && !views.includes(view)))
    notFound()
  return renderCalendar(personal ? "personal" : "project")
}
