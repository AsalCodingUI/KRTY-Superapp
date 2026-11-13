"use client"

import { createClient } from "@/shared/api/supabase/client"
import {
  markLocalWrite,
  useRealtimeRefresh,
} from "@/shared/hooks/useRealtimeRefresh"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { slugify } from "@/shared/lib/storage-names"
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
  "formula",
] as const
export type PropType = (typeof PROP_TYPES)[number]

export type PropOption = { name: string; color?: string }

/** One column of a database. */
export type WikiProp = {
  id: string
  name: string
  type: PropType
  options?: PropOption[]
  /** A formula column's expression (model/formula.ts). */
  formula?: string
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
  /** Only its creator and its members see it (and the pages under it,
   *  unless one of them is restricted itself): wiki_pages_access.sql. */
  restricted: boolean
  /** Nobody edits it until it's unlocked (an accidental-edit guard). */
  locked: boolean
  created_by: string | null
  /** What the viewer may do with it (the nearest restricted page decides). */
  access: "edit" | "view"
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
  "id, parent_id, title, position, updated_at, icon, cover, kind, schema, props, restricted, locked, created_by, access:my_access, editor:profiles!wiki_pages_updated_by_fkey(full_name)"

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
export function useWikiPage(id: string, enabled = true) {
  return useQuery({
    queryKey: wikiPageKey(id),
    enabled,
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
      // Someone given or losing a page: the list (what's visible) too.
      {
        table: "wiki_page_members",
        keys: (row) =>
          row?.page_id
            ? [WIKI_PAGES_KEY, wikiMembersKey(String(row.page_id))]
            : [WIKI_PAGES_KEY],
      },
    ],
    enabled,
  )
}

/** The pages under `parentId` (null: the top level), in order. A page
 *  whose parent the viewer can't see (restricted) sits at the top. */
export function childrenOf(pages: WikiPageMeta[], parentId: string | null) {
  if (parentId !== null) return pages.filter((p) => p.parent_id === parentId)
  const ids = new Set(pages.map((p) => p.id))
  return pages.filter((p) => p.parent_id === null || !ids.has(p.parent_id))
}

/** Whether the viewer may change the page now (edit access, not locked). */
export const canEditPage = (page: Pick<WikiPageMeta, "access" | "locked">) =>
  page.access === "edit" && !page.locked

/** The page whose members decide who sees `id`: itself or the nearest
 *  restricted page above it. Null: open to everyone. */
export function accessGate(pages: WikiPageMeta[], id: string) {
  const trail = trailOf(pages, id)
  for (let i = trail.length - 1; i >= 0; i--)
    if (trail[i].restricted) return trail[i]
  return null
}

const MEMBERS = "wiki_page_members"
export const wikiMembersKey = (pageId: string) =>
  ["wiki-members", pageId] as const

export type WikiMember = {
  profile_id: string
  can_edit: boolean
  name: string | null
  avatar_url: string | null
}

/** Who's on a restricted page's list. */
export function useWikiMembers(pageId: string | null) {
  return useQuery({
    queryKey: wikiMembersKey(pageId ?? ""),
    enabled: Boolean(pageId),
    queryFn: async (): Promise<WikiMember[]> => {
      const { data, error } = await supabase()
        .from(MEMBERS)
        .select("profile_id, can_edit, profile:profiles(full_name, avatar_url)")
        .eq("page_id", pageId!)
        .order("created_at")
      if (error) throw error
      return (
        (data ?? []) as unknown as {
          profile_id: string
          can_edit: boolean
          profile: {
            full_name: string | null
            avatar_url: string | null
          } | null
        }[]
      ).map(({ profile, ...m }) => ({
        ...m,
        name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
      }))
    },
  })
}

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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * A page's address, readable as Notion's: its title as a slug and its id's
 * first 8 characters ("/wiki/liburan-archive-678787b3"), so a new title
 * doesn't break links (the id part finds it). With only an id (a page not
 * titled yet): "/wiki/<id>".
 */
export function wikiHref(page: string | Pick<WikiPageMeta, "id" | "title">) {
  if (typeof page === "string") return `/wiki/${page}`
  const slug = slugify(page.title || "", 60)
  const short = page.id.slice(0, 8)
  return page.title?.trim() ? `/wiki/${slug}-${short}` : `/wiki/${short}`
}

/** The page an address points at: a full id (older links), or the 8
 *  characters after the slug. Null when no page matches. */
export function wikiIdOf(param: string, pages: WikiPageMeta[]) {
  const value = decodeURIComponent(param)
  if (UUID.test(value)) return value.toLowerCase()
  const short = /(?:^|-)([0-9a-f]{8})$/i.exec(value)?.[1]?.toLowerCase()
  if (!short) return null
  return pages.find((p) => p.id.startsWith(short))?.id ?? null
}

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
      // The page's own copy too (an editor opened again starts from it).
      queryClient.setQueryData<WikiPage | null>(wikiPageKey(id), (p) =>
        p ? { ...p, ...patch } : p,
      )
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
    /** Lock / unlock the page. */
    setLocked: async (id: string, locked: boolean) => {
      mark(id)
      const { error } = await supabase()
        .from(TABLE)
        .update({ locked })
        .eq("id", id)
      if (error) throw error
      queryClient.setQueryData<WikiPageMeta[]>(WIKI_PAGES_KEY, (pages) =>
        pages?.map((p) => (p.id === id ? { ...p, locked } : p)),
      )
    },
    /**
     * Only invited people (`restricted`), or everyone again. Restricting
     * starts the list with whoever had it already (`members`: the list of
     * the restricted page above it, if any) and the viewer, so nobody who
     * restricts a page loses it.
     */
    setRestricted: async (
      id: string,
      restricted: boolean,
      members: { profile_id: string; can_edit: boolean }[] = [],
      me?: string | null,
    ) => {
      if (restricted) {
        const rows = new Map(
          members.map((m) => [m.profile_id, { ...m, page_id: id }]),
        )
        if (me) rows.set(me, { profile_id: me, can_edit: true, page_id: id })
        if (rows.size) {
          const { error } = await supabase()
            .from(MEMBERS)
            .upsert([...rows.values()], { onConflict: "page_id,profile_id" })
          if (error) throw error
        }
      }
      mark(id)
      const { error } = await supabase()
        .from(TABLE)
        .update({ restricted })
        .eq("id", id)
      if (error) throw error
      await Promise.all([
        refresh(),
        queryClient.invalidateQueries({ queryKey: wikiMembersKey(id) }),
      ])
    },
    /** Add someone to a restricted page, or change what they may do. */
    setMember: async (pageId: string, profileId: string, canEdit: boolean) => {
      const { error } = await supabase()
        .from(MEMBERS)
        .upsert(
          { page_id: pageId, profile_id: profileId, can_edit: canEdit },
          { onConflict: "page_id,profile_id" },
        )
      if (error) throw error
      await queryClient.invalidateQueries({
        queryKey: wikiMembersKey(pageId),
      })
    },
    removeMember: async (pageId: string, profileId: string) => {
      const { error } = await supabase()
        .from(MEMBERS)
        .delete()
        .eq("page_id", pageId)
        .eq("profile_id", profileId)
      if (error) throw error
      await Promise.all([
        refresh(),
        queryClient.invalidateQueries({ queryKey: wikiMembersKey(pageId) }),
      ])
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

const RECENT_KEY = "wiki-recent"

/** The pages opened lately on this device, newest first (Home's row). */
export function readRecentPages(): string[] {
  try {
    const list = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
    return Array.isArray(list)
      ? list.filter((id) => typeof id === "string")
      : []
  } catch {
    return []
  }
}

export function rememberPage(id: string) {
  try {
    const next = [id, ...readRecentPages().filter((p) => p !== id)].slice(0, 12)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
}
