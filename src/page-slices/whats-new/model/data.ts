"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"
import {
  WHATS_NEW_AREAS,
  WHATS_NEW_AUDIENCES,
  WHATS_NEW_SURFACES,
  WHATS_NEW_TAGS,
  type WhatsNewArea,
  type WhatsNewAudience,
  type WhatsNewEntry,
  type WhatsNewSurface,
  type WhatsNewTag,
} from "./types"

export const whatsNewKeys = {
  all: ["whats-new"] as const,
  list: ["whats-new", "list"] as const,
  meta: ["whats-new", "meta"] as const,
}

const pick = <T extends string>(list: readonly T[], v: unknown, d: T): T =>
  list.includes(v as T) ? (v as T) : d

type Row = {
  id: string
  date: string
  title: string
  summary: string
  tags: string[]
  area: string
  audience: string
  surface: string
  thumbnail_url: string | null
  body: string
  published: boolean
  sort: number
  updated_at: string
}

export function entryOf(row: Row): WhatsNewEntry {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    summary: row.summary,
    tags: (row.tags ?? []).filter((t): t is WhatsNewTag =>
      (WHATS_NEW_TAGS as readonly string[]).includes(t),
    ),
    area: pick<WhatsNewArea>(WHATS_NEW_AREAS, row.area, "general"),
    audience: pick<WhatsNewAudience>(
      WHATS_NEW_AUDIENCES,
      row.audience,
      "everyone",
    ),
    surface: pick<WhatsNewSurface>(WHATS_NEW_SURFACES, row.surface, "app"),
    thumbnailUrl: row.thumbnail_url,
    body: row.body,
    published: row.published,
    sort: row.sort,
    updatedAt: row.updated_at,
  }
}

/**
 * Every entry the viewer may read (RLS: published ones; stakeholders get
 * drafts too). Who each is *for* is filtered by the caller.
 */
export function useWhatsNewEntries(enabled = true) {
  return useQuery({
    queryKey: whatsNewKeys.list,
    enabled,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("whats_new_entries")
        .select(
          "id, date, title, summary, tags, area, audience, surface, thumbnail_url, body, published, sort, updated_at",
        )
        .order("date", { ascending: false })
        .order("sort", { ascending: true })
      if (error) throw error
      return ((data ?? []) as Row[]).map(entryOf)
    },
  })
}

export type WhatsNewMeta = Pick<
  WhatsNewEntry,
  "id" | "date" | "tags" | "area" | "audience" | "published"
>

/** Ids, days, tags, areas and audiences only: the sidebar's unread state. */
export function useWhatsNewMeta(enabled: boolean) {
  return useQuery({
    queryKey: whatsNewKeys.meta,
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<WhatsNewMeta[]> => {
      const { data, error } = await createClient()
        .from("whats_new_entries")
        .select("id, date, tags, area, audience, published")
        .order("date", { ascending: false })
        .order("sort", { ascending: true })
      if (error) throw error
      return (
        (data ?? []) as Pick<
          Row,
          "id" | "date" | "tags" | "area" | "audience" | "published"
        >[]
      ).map((r) => ({
        id: r.id,
        date: r.date,
        tags: (r.tags ?? []).filter((t): t is WhatsNewTag =>
          (WHATS_NEW_TAGS as readonly string[]).includes(t),
        ),
        area: pick<WhatsNewArea>(WHATS_NEW_AREAS, r.area, "general"),
        audience: pick<WhatsNewAudience>(
          WHATS_NEW_AUDIENCES,
          r.audience,
          "everyone",
        ),
        published: r.published,
      }))
    },
  })
}
