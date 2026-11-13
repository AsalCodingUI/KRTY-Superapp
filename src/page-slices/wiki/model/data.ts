"use client"

import { createClient } from "@/shared/api/supabase/client"
import {
  markLocalWrite,
  useRealtimeRefresh,
} from "@/shared/hooks/useRealtimeRefresh"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

/** A row of wiki_pages (migrations/wiki_pages.sql), without its body. */
export type WikiPageMeta = {
  id: string
  parent_id: string | null
  title: string
  position: number
  updated_at: string
  updated_by_name: string | null
}

export type WikiPage = WikiPageMeta & { body: string }

const TABLE = "wiki_pages"
export const WIKI_PAGES_KEY = ["wiki-pages"] as const
export const wikiPageKey = (id: string) => ["wiki-page", id] as const

/** Pictures and files in wiki pages: report-images / doc-files, this
 *  folder (everyone signed in writes it; migrations/wiki_pages.sql). */
export const WIKI_FILES_FOLDER = "00000000-0000-0000-0000-00000000a1c1"

const supabase = () => createClient()

const META =
  "id, parent_id, title, position, updated_at, editor:profiles!wiki_pages_updated_by_fkey(full_name)"

type Row = Omit<WikiPageMeta, "updated_by_name"> & {
  body?: string
  editor: { full_name: string | null } | null
}

const toPage = ({ editor, ...row }: Row) => ({
  ...row,
  updated_by_name: editor?.full_name ?? null,
})

/** Every page (no bodies), in the panel's order. */
export function useWikiPages(enabled = true) {
  useWikiLive(enabled)
  return useQuery({
    queryKey: WIKI_PAGES_KEY,
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<WikiPageMeta[]> => {
      const { data, error } = await supabase()
        .from(TABLE)
        .select(META)
        .order("position")
        .order("created_at")
      if (error) throw error
      return ((data ?? []) as unknown as Row[]).map(toPage)
    },
  })
}

/** One page with its body. */
export function useWikiPage(id: string) {
  return useQuery({
    queryKey: wikiPageKey(id),
    staleTime: 30_000,
    queryFn: async (): Promise<WikiPage | null> => {
      const { data, error } = await supabase()
        .from(TABLE)
        .select(`${META}, body`)
        .eq("id", id)
        .maybeSingle()
      if (error) throw error
      return data ? (toPage(data as unknown as Row) as WikiPage) : null
    },
  })
}

/** Someone else's edits show up as they happen (the list, and a page's
 *  last-edited line; an open editor keeps what's being typed). */
function useWikiLive(enabled: boolean) {
  useRealtimeRefresh(
    "wiki",
    [
      {
        table: TABLE,
        keys: (row) =>
          row?.id
            ? [WIKI_PAGES_KEY, wikiPageKey(String(row.id))]
            : [WIKI_PAGES_KEY],
      },
    ],
    enabled,
  )
}

/** The pages under `parentId` (null: the top level), in order. */
export const childrenOf = (pages: WikiPageMeta[], parentId: string | null) =>
  pages.filter((p) => p.parent_id === parentId)

/** `id` and its parents, top first (a breadcrumb). */
export function trailOf(pages: WikiPageMeta[], id: string) {
  const byId = new Map(pages.map((p) => [p.id, p]))
  const trail: WikiPageMeta[] = []
  const seen = new Set<string>()
  let page = byId.get(id)
  while (page && !seen.has(page.id)) {
    seen.add(page.id)
    trail.unshift(page)
    page = page.parent_id ? byId.get(page.parent_id) : undefined
  }
  return trail
}

export const wikiHref = (id: string) => `/wiki/${id}`

export function useWikiWriter() {
  const queryClient = useQueryClient()
  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: WIKI_PAGES_KEY }),
    [queryClient],
  )
  const mark = (id: string) =>
    markLocalWrite(TABLE, [id], [WIKI_PAGES_KEY, wikiPageKey(id)])

  return {
    /** A new, untitled page (under `parentId`, after its siblings). */
    create: async (parentId: string | null) => {
      const siblings = childrenOf(
        queryClient.getQueryData<WikiPageMeta[]>(WIKI_PAGES_KEY) ?? [],
        parentId,
      )
      const position = Math.max(0, ...siblings.map((p) => p.position)) + 1
      const { data, error } = await supabase()
        .from(TABLE)
        .insert({ parent_id: parentId, position })
        .select("id")
        .single()
      if (error) throw error
      mark(data.id)
      await refresh()
      return data.id as string
    },
    /** Title and / or body (autosave). */
    save: async (id: string, patch: { title?: string; body?: string }) => {
      mark(id)
      const { error } = await supabase().from(TABLE).update(patch).eq("id", id)
      if (error) throw error
      // The panel shows the new title (no refetch: it's ours).
      if (patch.title !== undefined)
        queryClient.setQueryData<WikiPageMeta[]>(WIKI_PAGES_KEY, (pages) =>
          pages?.map((p) =>
            p.id === id ? { ...p, title: patch.title ?? p.title } : p,
          ),
        )
    },
    /** The page and everything under it. */
    remove: async (id: string) => {
      mark(id)
      const { error } = await supabase().from(TABLE).delete().eq("id", id)
      if (error) throw error
      queryClient.removeQueries({ queryKey: wikiPageKey(id) })
      await refresh()
    },
  }
}
