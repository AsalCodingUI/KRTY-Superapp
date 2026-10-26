import { PortalSessionEnded } from "@/page-slices/projects/ui/portal/PortalSessionEnded"
import {
  PortalReports,
  type PortalReport,
} from "@/page-slices/projects/ui/portal/PortalReports"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { portalPage } from "../session"

/** The reports the team shared with the client (a share link is on). */
export default async function PortalReportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { token } = await params
  const session = await portalPage(token, "/reports", await searchParams)
  if (!session.signedIn) return <PortalSessionEnded />
  const { data } = await createAdminClient()
    .from("project_reports" as never)
    .select(
      "id, title, body, report_date, author:profiles!project_reports_author_id_fkey ( full_name, avatar_url )",
    )
    .eq("project_id" as never, session.project.id as never)
    .not("share_token" as never, "is", null)
    .order("report_date" as never, { ascending: false })
  return <PortalReports reports={(data ?? []) as unknown as PortalReport[]} />
}
