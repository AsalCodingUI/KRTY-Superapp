"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useLocale, useT } from "@/shared/i18n/client"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"

export type SearchScope =
  | "all"
  | "pages"
  | "projects"
  | "tasks"
  | "files"
  | "policies"
  | "people"

export type SearchHit = {
  id: string
  kind: Exclude<SearchScope, "all">
  title: string
  /** Muted context after the title, e.g. client or project name. */
  meta?: string | null
  href: string
  /** Project id for the tile colour, or avatar url for people. */
  projectId?: string
  avatarUrl?: string | null
  done?: boolean
}

const LIMIT = 6

/** `%` and `_` are wildcards in ILIKE; match them literally. */
function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`
}

/** Values inside a PostgREST `or=(...)` filter are quoted so `,` `(` `)` stay literal. */
function quoted(value: string) {
  return `"${value.replace(/["\\]/g, (c) => `\\${c}`)}"`
}

export function useDebounced<T>(value: T, ms = 200) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

type ProjectRef = { id: string; name: string } | null

/**
 * Projects, tasks, files and documents the viewer can read (RLS decides), and
 * people for stakeholders. One request per source, in parallel.
 */
export function useRecordSearch(query: string, options: { people: boolean }) {
  const supabase = useMemo(() => createClient(), [])
  const t = useT("shell")
  const tNav = useT("nav")
  const locale = useLocale()
  const q = query.trim()

  return useQuery({
    queryKey: ["global-search", q, options.people, locale],
    enabled: q.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    queryFn: async (): Promise<SearchHit[]> => {
      const like = likePattern(q)
      const [projects, tasks, docs, files, policies, people] =
        await Promise.all([
          supabase
            .from("projects")
            .select("id, name, client_name, quarter_id")
            .or(`name.ilike.${quoted(like)},client_name.ilike.${quoted(like)}`)
            .order("end_date", { ascending: false })
            .limit(LIMIT),
          supabase
            .from("project_tasks")
            .select("id, title, done, project_id, projects ( id, name )")
            .ilike("title", like)
            .order("created_at", { ascending: false })
            .limit(LIMIT),
          supabase
            .from("project_documents")
            .select("id, title, project_id, projects ( id, name )")
            .ilike("title", like)
            .limit(LIMIT),
          supabase
            .from("project_files")
            .select("id, name, project_id, projects ( id, name )")
            .ilike("name", like)
            .limit(LIMIT),
          // Employees only get published, live rules (RLS).
          supabase
            .from("policy_documents")
            .select("id, title, category")
            .ilike("title", like)
            .is("archived_at", null)
            .order("title")
            .limit(LIMIT),
          options.people
            ? supabase
                .from("profiles")
                .select("id, full_name, job_title, avatar_url")
                .or(
                  `full_name.ilike.${quoted(like)},email.ilike.${quoted(like)}`,
                )
                .order("full_name")
                .limit(LIMIT)
            : Promise.resolve({ data: [], error: null }),
        ])

      // One failing source shouldn't hide the others.
      for (const r of [projects, tasks, docs, files, policies, people])
        if (r.error) console.warn("[search]", r.error.message)

      const hits: SearchHit[] = []
      for (const p of projects.data ?? []) {
        hits.push({
          id: `project:${p.id}`,
          kind: "projects",
          title: p.name,
          meta:
            [p.client_name, p.quarter_id].filter(Boolean).join(" · ") || null,
          href: `/projects/${p.id}`,
          projectId: p.id,
        })
      }
      for (const t of tasks.data ?? []) {
        const project = t.projects as unknown as ProjectRef
        hits.push({
          id: `task:${t.id}`,
          kind: "tasks",
          title: t.title,
          meta: project?.name,
          href: `/projects/${t.project_id}/tasks`,
          projectId: t.project_id,
          done: t.done,
        })
      }
      for (const d of docs.data ?? []) {
        const project = d.projects as unknown as ProjectRef
        hits.push({
          id: `doc:${d.id}`,
          kind: "files",
          title: d.title,
          meta: project
            ? `${t("searchMetaDocument")} · ${project.name}`
            : t("searchMetaDocument"),
          href: `/projects/${d.project_id}/documents`,
          projectId: d.project_id,
        })
      }
      for (const f of files.data ?? []) {
        const project = f.projects as unknown as ProjectRef
        hits.push({
          id: `file:${f.id}`,
          kind: "files",
          title: f.name,
          meta: project
            ? `${t("searchMetaLibrary")} · ${project.name}`
            : t("searchMetaLibrary"),
          href: `/projects/${f.project_id}/library`,
          projectId: f.project_id,
        })
      }
      for (const p of policies.data ?? []) {
        hits.push({
          id: `policy:${p.id}`,
          kind: "policies",
          title: p.title,
          meta: `${tNav("policies")} · ${p.category}`,
          href: `/policies/${p.id}`,
        })
      }
      for (const u of people.data ?? []) {
        hits.push({
          id: `person:${u.id}`,
          kind: "people",
          title: u.full_name ?? t("searchUnnamed"),
          meta: u.job_title,
          href: `/performance/employee/${u.id}`,
          avatarUrl: u.avatar_url,
        })
      }
      return hits
    },
  })
}

const RECENT_KEY = "global_search_recent"
const RECENT_MAX = 5

export function readRecent(): SearchHit[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    const list = raw ? (JSON.parse(raw) as SearchHit[]) : []
    return Array.isArray(list) ? list.slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}

export function pushRecent(hit: SearchHit) {
  try {
    const next = [hit, ...readRecent().filter((h) => h.id !== hit.id)].slice(
      0,
      RECENT_MAX,
    )
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // Storage unavailable (private mode): recents are a nicety only.
  }
}
