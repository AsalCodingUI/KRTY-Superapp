import { notFound, redirect } from "next/navigation"
import PerformanceRoute from "../page"

export const dynamic = "force-dynamic"

const TABS = ["360-review", "one-on-one", "competency-library"]

export default async function PerformanceTabRoute({
  params,
}: {
  params: Promise<{ tab: string }>
}) {
  const { tab } = await params
  // Old links: project management moved to /projects; Team KPI is "team".
  if (tab === "list-project") redirect("/projects")
  // A lead's team ("Tim saya") is now each project's "Penilaian" page.
  if (tab === "lead-review" || tab === "team") redirect("/projects")
  if (!TABS.includes(tab)) notFound()
  return <PerformanceRoute />
}
