"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"

export type ProjectSummary = {
  id: string
  name: string
  status: "Active" | "Completed" | "Archived"
  client_name: string | null
}

/** Name/status of one project for the sidebar and breadcrumb. */
export function useProjectSummary(id: string | null | undefined) {
  return useQuery({
    queryKey: ["project-summary", id],
    enabled: Boolean(id),
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await createClient()
        .from("projects")
        .select("id, name, status, client_name")
        .eq("id", id!)
        .maybeSingle()
      return (data as ProjectSummary | null) ?? null
    },
  })
}
