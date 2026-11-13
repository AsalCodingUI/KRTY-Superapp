"use client"

import { createClient } from "@/shared/api/supabase/client"
import {
  markLocalWrite,
  useRealtimeRefresh,
} from "@/shared/hooks/useRealtimeRefresh"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

/** A database's property types (wiki_pages_notion.sql). */
export const PROP_TYPES = [
  "text",
  "number",
  "checkbox",
  "date",
  "select",
  "multi_select",
  "url",
] as const
export type PropType = (typeof PROP_TYPES)[number]

export type PropOption = { name: string; color?: string }

/** One column of a database. */
export type WikiProp = {
  id: string
  name: string
  type: PropType
  options?: PropOption[]
}

export type PropValue = string | number | boolean | string[] | null

/** A row of wiki_pages (migrations/wiki_pages*.sql), without its body. */
export type WikiPageMeta = {
  id: string
  parent_id: string | null
  title: string
  position: number
  updated_at: string
  updated_by_name: string | null
  /** An emoji, or a picture's URL. */
  icon: string | null
  /** A picture's URL. */
  cover: string | null
  /** A database: its subpages are its rows, `schema` their columns. */
  kind: "page" | "database"
  schema: WikiProp[]
  /** A row's values, by property id. */
  props: Record<string, PropValue>
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
  "id, parent_id, title, position, updated_at, icon, cover, kind, schema, props, editor:profiles!wiki_pages_updated_by_fkey(full_name)"

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

/** What a save may change. */
export type WikiPatch = Partial<
  Pick<WikiPageMeta, "title" | "icon" | "cover" | "kind" | "schema" | "props">
> & { body?: string }

/** A new property's id: short, unique in its database. */
export const newPropId = () => Math.random().toString(36).slice(2, 8)

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
    create: async (
      parentId: string | null,
      extra: Partial<
        Pick<WikiPageMeta, "kind" | "schema" | "props" | "title">
      > = {},
    ) => {
      const siblings = childrenOf(
        queryClient.getQueryData<WikiPageMeta[]>(WIKI_PAGES_KEY) ?? [],
        parentId,
      )
      const position = Math.max(0, ...siblings.map((p) => p.position)) + 1
      const { data, error } = await supabase()
        .from(TABLE)
        .insert({ parent_id: parentId, position, ...extra })
        .select("id")
        .single()
      if (error) throw error
      mark(data.id)
      await refresh()
      return data.id as string
    },
    /** Title and / or body (autosave). */
    save: async (id: string, patch: WikiPatch) => {
      mark(id)
      const { error } = await supabase().from(TABLE).update(patch).eq("id", id)
      if (error) throw error
      // The list shows it at once (no refetch: it's ours); the body isn't
      // in the list.
      const { body: _body, ...listed } = patch
      void _body
      if (Object.keys(listed).length)
        queryClient.setQueryData<WikiPageMeta[]>(WIKI_PAGES_KEY, (pages) =>
          pages?.map((p) => (p.id === id ? { ...p, ...listed } : p)),
        )
    },
    /** One property of a row: merged into its latest values first (two
     *  quick edits on one row don't undo each other). */
    setProp: async (rowId: string, propId: string, value: PropValue) => {
      let props: Record<string, PropValue> = {}
      queryClient.setQueryData<WikiPageMeta[]>(WIKI_PAGES_KEY, (pages) =>
        pages?.map((p) => {
          if (p.id !== rowId) return p
          props = { ...p.props, [propId]: value }
          return { ...p, props }
        }),
      )
      mark(rowId)
      const { error } = await supabase()
        .from(TABLE)
        .update({ props })
        .eq("id", rowId)
      if (error) throw error
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
