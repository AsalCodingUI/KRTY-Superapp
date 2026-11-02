import { createAdminClient } from "@/shared/api/supabase/admin"
import { reportTokensOf } from "@/shared/lib/portal-docs"
import { cache } from "react"

export type SharedReport = {
  id: string
  share_token: string
  title: string
  body: string
  report_date: string
  updated_at: string
  project: { name: string } | null
}

/** A link key's shape (`<project-name>-<token>` or a bare token). */
export const isReportKey = (key: string) => /^[A-Za-z0-9_-]{12,120}$/.test(key)

/**
 * The report a shared link opens, or null (unknown key, or the link was
 * turned off). Once per request: the page, its metadata and its card ask.
 */
export const sharedReport = cache(
  async (key: string): Promise<SharedReport | null> => {
    if (!isReportKey(key)) return null
    // `<project-name>-<token>`, or a bare token (older links).
    const { data } = await createAdminClient()
      .from("project_reports" as never)
      .select(
        "id, share_token, title, body, report_date, updated_at, project:projects ( name )",
      )
      .in("share_token" as never, reportTokensOf(key) as never)
      .limit(1)
      .maybeSingle()
    return (data as unknown as SharedReport | null) ?? null
  },
)
