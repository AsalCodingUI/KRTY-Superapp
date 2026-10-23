"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

/** Rules other pages show inline, by their fixed slug. */
export const POLICY_SLUGS = {
  leave: "aturan-cuti",
} as const

export type PublishedPolicy = {
  id: string
  title: string
  body: string
  version: string
  effectiveAt: string | null
  publishedAt: string | null
}

/**
 * The version in force of one rule. Null when it is missing, archived or
 * never published (RLS hides those from employees anyway).
 */
export function usePublishedPolicy(slug: string) {
  const supabase = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: ["policies", "published", slug],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<PublishedPolicy | null> => {
      const { data, error } = await supabase
        .from("policy_documents")
        .select(
          `id, archived_at,
           current:policy_versions!policy_documents_current_version_id_fkey (
             title, body, version_number, effective_at, published_at
           )`,
        )
        .eq("slug", slug)
        .maybeSingle()
      if (error) throw error
      const current = data?.current as unknown as {
        title: string
        body: string
        version_number: string
        effective_at: string | null
        published_at: string | null
      } | null
      if (!data || data.archived_at || !current) return null
      return {
        id: data.id,
        title: current.title,
        body: current.body,
        version: current.version_number,
        effectiveAt: current.effective_at,
        publishedAt: current.published_at,
      }
    },
  })
}
