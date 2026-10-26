import { PortalSessionEnded } from "@/page-slices/projects/ui/portal/PortalSessionEnded"
import { PortalOverview } from "@/page-slices/projects/ui/portal/PortalOverview"
import type { PortalReport } from "@/page-slices/projects/ui/portal/PortalReports"
import type {
  PhaseRow,
  StepRow,
} from "@/page-slices/projects/ui/workspace/data"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { portalPage } from "./session"

/** Portal home: status, phases and their steps, facts, latest reports. */
export default async function PortalHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { token } = await params
  const session = await portalPage(token, "", await searchParams)
  if (!session.signedIn) return <PortalSessionEnded />
  const { project } = session
  const admin = createAdminClient()
  const [
    { data: phases },
    { data: steps },
    { data: reports },
    { data: links },
  ] = await Promise.all([
    admin
      .from("project_phases")
      // Only what the page shows: no SLA weights or internal notes.
      .select("id, project_id, name, position, status, due_date, completed_at")
      .eq("project_id", project.id)
      .order("position"),
    admin
      .from("project_steps")
      .select("id, phase_id, title, status, position")
      .eq("project_id", project.id)
      .order("position")
      .order("created_at"),
    admin
      .from("project_reports" as never)
      .select(
        "id, title, body, report_date, author:profiles!project_reports_author_id_fkey ( full_name, avatar_url )",
      )
      .eq("project_id" as never, project.id as never)
      .not("share_token" as never, "is", null)
      .order("report_date" as never, { ascending: false })
      .limit(3),
    admin
      .from("project_links" as never)
      .select("id, url, title")
      .eq("project_id" as never, project.id as never)
      .order("position" as never)
      .order("created_at" as never),
  ])

  return (
    <PortalOverview
      base={`/p/${token}`}
      project={project}
      phases={(phases ?? []) as PhaseRow[]}
      steps={(steps ?? []) as StepRow[]}
      reports={(reports ?? []) as unknown as PortalReport[]}
      links={
        (links ?? []) as unknown as {
          id: string
          url: string
          title: string | null
        }[]
      }
    />
  )
}
