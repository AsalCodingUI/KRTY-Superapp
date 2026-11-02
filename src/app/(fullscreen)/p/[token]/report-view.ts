"use server"

import { createAdminClient } from "@/shared/api/supabase/admin"
import { isPortalSignedIn, portalByToken } from "@/shared/lib/portal"
import { pendingReportView, saveReportView } from "@/shared/lib/report-views"

/**
 * A report opened in the client portal: noted as a read (unless it's the
 * team, a bot or a repeat within 30 minutes). Only for a signed-in portal
 * and a report of its project that's still shared.
 */
export async function noteReportOpened(token: string, reportId: string) {
  if (typeof reportId !== "string" || !/^[0-9a-f-]{36}$/i.test(reportId)) return
  const portal = await portalByToken(token)
  if (!portal || !(await isPortalSignedIn(portal))) return
  const { data } = await createAdminClient()
    .from("project_reports" as never)
    .select("id")
    .eq("id" as never, reportId as never)
    .eq("project_id" as never, portal.project_id as never)
    .not("share_token" as never, "is", null)
    .maybeSingle()
  if (!data) return
  const view = await pendingReportView(reportId, "portal")
  if (view) await saveReportView(view)
}
