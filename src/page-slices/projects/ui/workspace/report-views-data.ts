"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "./data"

/**
 * When clients opened the project's shared reports (report_views, written
 * by the server: no team, no bots, one per visitor per 30 minutes),
 * newest first, grouped by report.
 */

export type ReportView = {
  id: string
  report_id: string
  viewed_at: string
  source: "link" | "portal"
  device: "mobile" | "tablet" | "desktop" | null
  user_agent: string | null
  country: string | null
}

// Not in the generated types yet.
const TABLE = "report_views" as never

export function useReportViews(projectId: string) {
  return useQuery({
    queryKey: ["report-views", projectId] as const,
    queryFn: async () => {
      const { data, error } = await supabase()
        .from(TABLE)
        .select(
          "id, report_id, viewed_at, source, device, user_agent, country, report:project_reports!inner ( project_id )",
        )
        .eq("report.project_id" as never, projectId as never)
        .order("viewed_at" as never, { ascending: false })
        .limit(1000)
      if (error) throw error
      const byReport = new Map<string, ReportView[]>()
      for (const v of (data ?? []) as unknown as ReportView[]) {
        const list = byReport.get(v.report_id) ?? []
        list.push(v)
        byReport.set(v.report_id, list)
      }
      return byReport
    },
    staleTime: 30_000,
  })
}
