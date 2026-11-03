"use client"

import { createClient } from "@/shared/api/supabase/client"
import type { BriefFileRef } from "@/shared/lib/briefs/brief"
import type {
  BriefAnswers,
  BriefSection,
  BriefStatus,
} from "@/shared/lib/briefs/types"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export type BriefListRow = {
  id: string
  title: string
  token: string
  status: BriefStatus
  sets: string[]
  offers: string[]
  declined: string[]
  accepted: string[]
  sections: BriefSection[]
  answers: BriefAnswers
  client_id: string
  project_id: string | null
  opened_at: string | null
  saved_at: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
  client: { id: string; name: string } | null
  project: { id: string; name: string } | null
  files: (BriefFileRef & { mime_type: string | null })[]
}

export const BRIEFS_KEY = ["briefs"] as const

const SELECT = `id, title, token, status, sets, offers, declined, accepted, sections, answers,
  client_id, project_id, opened_at, saved_at, submitted_at, created_at, updated_at,
  client:clients ( id, name ),
  project:projects ( id, name ),
  files:brief_files ( id, name, file_size, question_id, mime_type )`

/** A brief linked to a project, as a shortcut on the project (list rows,
 *  cards, its header): only what the shortcut shows. */
export type BriefLink = {
  id: string
  title: string
  project_id: string
  status: BriefStatus
}

/** Every linked brief the viewer may see, by project (one small query,
 *  shared by every row). */
export function useBriefLinks() {
  return useQuery({
    queryKey: [...BRIEFS_KEY, "links"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("briefs")
        .select("id, title, project_id, status")
        .not("project_id", "is", null)
        .order("created_at")
      if (error) throw error
      const byProject = new Map<string, BriefLink[]>()
      for (const b of (data ?? []) as BriefLink[]) {
        byProject.set(b.project_id, [...(byProject.get(b.project_id) ?? []), b])
      }
      return byProject
    },
  })
}

/** Every brief the viewer may see (all of them in Dokumen, or a project's). */
export function useBriefs(projectId?: string) {
  return useQuery({
    queryKey: [...BRIEFS_KEY, projectId ?? "all"],
    queryFn: async () => {
      let query = createClient()
        .from("briefs")
        .select(SELECT)
        .order("updated_at", { ascending: false })
      if (projectId) query = query.eq("project_id", projectId)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as unknown as BriefListRow[]
    },
  })
}

export function useBrief(id: string | null) {
  return useQuery({
    queryKey: [...BRIEFS_KEY, "one", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("briefs")
        .select(SELECT)
        .eq("id", id!)
        .maybeSingle()
      if (error) throw error
      return (data as unknown as BriefListRow | null) ?? null
    },
  })
}

export function useRefreshBriefs() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: BRIEFS_KEY })
}

/** Writes a brief's own columns (questions, answers the team fills, title). */
export async function patchBrief(
  id: string,
  patch: Partial<{
    title: string
    sections: BriefSection[]
    answers: BriefAnswers
    status: BriefStatus
  }>,
) {
  const { error } = await createClient()
    .from("briefs")
    .update(patch as never)
    .eq("id", id)
  if (error) throw error
}

/** Clients for the picker, with how many briefs each already has. */
export function useBriefClients(enabled: boolean) {
  return useQuery({
    queryKey: [...BRIEFS_KEY, "clients"],
    enabled,
    queryFn: async () => {
      const db = createClient()
      const [{ data: clients }, { data: briefs }] = await Promise.all([
        db
          .from("clients")
          .select("id, name, contact_name")
          .is("archived_at", null),
        db.from("briefs").select("client_id"),
      ])
      const count = new Map<string, number>()
      for (const b of briefs ?? [])
        count.set(b.client_id, (count.get(b.client_id) ?? 0) + 1)
      type Row = { id: string; name: string; contact_name: string | null }
      // Listed by the person we talk to (the PIC), the company beside it.
      return ((clients ?? []) as Row[])
        .map((c) => ({
          ...c,
          pic: c.contact_name?.trim() || c.name,
          briefs: count.get(c.id) ?? 0,
        }))
        .sort((a, b) => a.pic.localeCompare(b.pic))
    },
  })
}
