"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

/** A row of lead_sources (migrations/lead_sources.sql). */
export type LeadSource = {
  id: string
  /** Null: a studio default. */
  user_id: string | null
  name: string
  url: string
  position: number
}

/** A source as the viewer sees it. */
export type LeadSite = LeadSource & {
  studio: boolean
  /** A studio default this person hid. */
  hidden: boolean
  /** One of BUILT_IN (no table yet): read-only. */
  builtIn?: boolean
}

export const LEAD_SITES_KEY = ["lead-sites"] as const

const supabase = () => createClient()

/**
 * The studio defaults as the migration seeds them, shown read-only until
 * lead_sources exists (a deploy before the migration, or a local test).
 */
const BUILT_IN: LeadSite[] = [
  ["builtin-gmail", "Gmail", "https://mail.google.com/mail/"],
  ["builtin-telegram", "Telegram", "https://web.telegram.org/a/"],
  ["builtin-dribbble", "Dribbble", "https://dribbble.com/"],
  ["builtin-behance", "Behance", "https://www.behance.net/"],
].map(([id, name, url], i) => ({
  id,
  user_id: null,
  name,
  url,
  position: i + 1,
  studio: true,
  hidden: false,
  builtIn: true,
}))

/** Postgres' "no such table" (42P01) or PostgREST's (PGRST205). */
const missingTable = (error: { code?: string } | null) =>
  error?.code === "42P01" || error?.code === "PGRST205"

async function fetchSites(userId: string): Promise<LeadSite[]> {
  const [sources, hidden] = await Promise.all([
    supabase()
      .from("lead_sources")
      .select("id, user_id, name, url, position")
      .order("position")
      .order("created_at"),
    supabase()
      .from("lead_source_hidden")
      .select("source_id")
      .eq("user_id", userId),
  ])
  if (missingTable(sources.error)) return BUILT_IN
  if (sources.error) throw sources.error
  const hiddenIds = new Set(
    ((hidden.data ?? []) as { source_id: string }[]).map((h) => h.source_id),
  )
  return ((sources.data ?? []) as LeadSource[]).map((s) => ({
    ...s,
    studio: s.user_id === null,
    hidden: hiddenIds.has(s.id),
  }))
}

/** The studio's sites and the viewer's own (hidden ones flagged). */
export function useLeadSites(userId: string | null | undefined) {
  return useQuery({
    queryKey: [...LEAD_SITES_KEY, userId],
    queryFn: () => fetchSites(userId!),
    enabled: Boolean(userId),
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

export function useLeadWriter(userId: string | null | undefined) {
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
    /** Your own, or (studio: true, stakeholders) a studio default. */
    add: (name: string, url: string, position: number, studio = false) =>
      run(
        supabase()
          .from("lead_sources")
          .insert({
            user_id: studio ? null : userId,
            name: name.trim(),
            url,
            position,
          }),
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
    setHidden: (id: string, hidden: boolean) =>
      run(
        hidden
          ? supabase()
              .from("lead_source_hidden")
              .insert({ user_id: userId, source_id: id })
          : supabase()
              .from("lead_source_hidden")
              .delete()
              .eq("user_id", userId)
              .eq("source_id", id),
      ),
  }
}
