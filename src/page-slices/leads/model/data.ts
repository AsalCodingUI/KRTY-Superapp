"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

/** A row of lead_sources (migrations/lead_sources.sql): one shared list,
 *  the same for every PM and stakeholder. */
export type LeadSite = {
  id: string
  name: string
  url: string
  position: number
  /** One of BUILT_IN (no table yet): read-only. */
  builtIn?: boolean
}

export const LEAD_SITES_KEY = ["lead-sites"] as const

const supabase = () => createClient()

/**
 * The first sites as the migration seeds them, shown read-only until
 * lead_sources exists (a deploy before the migration, or a local test).
 */
const BUILT_IN: LeadSite[] = [
  ["builtin-gmail", "Gmail", "https://mail.google.com/mail/"],
  ["builtin-telegram", "Telegram", "https://web.telegram.org/a/"],
  ["builtin-dribbble", "Dribbble", "https://dribbble.com/"],
  ["builtin-behance", "Behance", "https://www.behance.net/"],
].map(([id, name, url], i) => ({
  id,
  name,
  url,
  position: i + 1,
  builtIn: true,
}))

/** Postgres' "no such table" (42P01) or PostgREST's (PGRST205). */
const missingTable = (error: { code?: string } | null) =>
  error?.code === "42P01" || error?.code === "PGRST205"

async function fetchSites(): Promise<LeadSite[]> {
  const { data, error } = await supabase()
    .from("lead_sources")
    .select("id, name, url, position")
    .order("position")
    .order("created_at")
  if (missingTable(error)) return BUILT_IN
  if (error) throw error
  return (data ?? []) as LeadSite[]
}

/** The studio's sites (the Leads panel and Kelola situs). */
export function useLeadSites(enabled = true) {
  return useQuery({
    queryKey: LEAD_SITES_KEY,
    queryFn: fetchSites,
    enabled,
    staleTime: 60_000,
  })
}

/** https:// only (the app shows nothing else), trimmed. */
export function normalizeUrl(raw: string): string | null {
  const value = raw.trim()
  const withScheme = /^[a-z]+:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withScheme)
    return url.protocol === "https:" && url.hostname.includes(".")
      ? url.toString()
      : null
  } catch {
    return null
  }
}

/** The host, for a subtitle (mail.google.com). */
export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function useLeadWriter() {
  const queryClient = useQueryClient()
  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: LEAD_SITES_KEY }),
    [queryClient],
  )
  const run = async (op: PromiseLike<{ error: unknown }>) => {
    const { error } = await op
    await refresh()
    if (error) throw error
  }
  return {
    add: (name: string, url: string, position: number) =>
      run(
        supabase()
          .from("lead_sources")
          .insert({ name: name.trim(), url, position }),
      ),
    rename: (id: string, name: string) =>
      run(
        supabase()
          .from("lead_sources")
          .update({ name: name.trim() })
          .eq("id", id),
      ),
    remove: (id: string) =>
      run(supabase().from("lead_sources").delete().eq("id", id)),
  }
}
