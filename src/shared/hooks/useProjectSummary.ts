"use client"

import { createClient } from "@/shared/api/supabase/client"
import { whereRef } from "@/shared/lib/url-params"
import { useQuery } from "@tanstack/react-query"

export type ProjectSummary = {
  id: string
  name: string
  status: "Planned" | "Active" | "Review" | "Completed" | "Archived"
  client_name: string | null
}

/**
 * Name/status of one project for the sidebar and breadcrumb, by its id or
 * the key in its URL (`milxa-7b583164`).
 */
export function useProjectSummary(ref: string | null | undefined) {
  return useQuery({
    queryKey: ["project-summary", ref],
    enabled: Boolean(ref),
    staleTime: 60_000,
    queryFn: async () => {
      const query = whereRef(
        createClient().from("projects").select("id, name, status, client_name"),
        ref!,
      )
      if (!query) return null
      const { data } = await query.maybeSingle()
      return (data as ProjectSummary | null) ?? null
    },
  })
}
