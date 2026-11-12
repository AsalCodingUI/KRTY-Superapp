import { notFound, permanentRedirect } from "next/navigation"
import { renderCalendar } from "../render-calendar"

/** /calendar/<view>. The old personal calendar (/calendar/personal[/<view>])
 *  is the same page now: it redirects there. Anything else 404s. */
const VIEWS = ["timeline", "week", "month"]

export const dynamic = "force-dynamic"

export default async function CalendarTabPage({
  params,
}: {
  params: Promise<{ tab: string[] }>
}) {
  const { tab } = await params
  if (tab[0] === "personal") {
    const view = tab[1] === "week" || tab[1] === "month" ? `/${tab[1]}` : ""
    permanentRedirect(`/calendar${view}`)
  }
  if (tab.length > 1 || !VIEWS.includes(tab[0])) notFound()
  return renderCalendar()
}
