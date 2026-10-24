"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"

export type ProcessTask = { id: string; title: string; position: number }
export type ProcessStep = {
  id: string
  title: string
  description: string | null
  position: number
  tasks: ProcessTask[]
}
export type ProcessPhase = {
  id: string
  name: string
  description: string | null
  position: number
  steps: ProcessStep[]
}
export type Process = {
  id: string
  name: string
  description: string | null
  is_default: boolean
  updated_at: string
  phases: ProcessPhase[]
  projects: { count: number }[]
}

/** List-level process: phase names and step/task counts, not the full tree. */
export type ProcessSummary = {
  id: string
  name: string
  description: string | null
  is_default: boolean
  updated_at: string
  phases: {
    id: string
    name: string
    position: number
    steps: { id: string; tasks: { count: number }[] }[]
  }[]
  projects: { count: number }[]
}

export const processKeys = {
  all: ["processes"] as const,
  list: () => ["processes", "list"] as const,
  detail: (id: string) => ["processes", "detail", id] as const,
}

export const supabase = () => createClient()

const byPosition = <T extends { position: number }>(a: T, b: T) =>
  a.position - b.position

/** Sorts phases, steps and tasks by position (PostgREST can't order nested). */
function sortTree(p: Process): Process {
  return {
    ...p,
    phases: [...(p.phases ?? [])].sort(byPosition).map((ph) => ({
      ...ph,
      steps: [...(ph.steps ?? [])].sort(byPosition).map((s) => ({
        ...s,
        tasks: [...(s.tasks ?? [])].sort(byPosition),
      })),
    })),
  }
}

/**
 * Every process with phase names and step/task counts (stakeholders only).
 * The editor loads one full tree with `useProcess`.
 */
export function useProcesses(enabled = true) {
  const db = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: processKeys.list(),
    enabled,
    queryFn: async () => {
      const { data, error } = await db
        .from("processes")
        .select(
          `id, name, description, is_default, updated_at,
           phases:process_phases ( id, name, position,
             steps:process_steps ( id, tasks:process_tasks ( count ) ) ),
           projects:projects!projects_process_id_fkey ( count )`,
        )
        .order("is_default", { ascending: false })
        .order("name")
      if (error) throw error
      return ((data ?? []) as unknown as ProcessSummary[]).map((p) => ({
        ...p,
        phases: [...(p.phases ?? [])].sort(byPosition),
      }))
    },
  })
}

/** One process with its full tree (null when it doesn't exist). */
export function useProcess(id: string, enabled = true) {
  const db = useMemo(() => createClient(), [])
  return useQuery({
    queryKey: processKeys.detail(id),
    enabled,
    queryFn: async () => {
      const { data, error } = await db
        .from("processes")
        .select(
          `id, name, description, is_default, updated_at,
           phases:process_phases ( id, name, description, position,
             steps:process_steps ( id, title, description, position,
               tasks:process_tasks ( id, title, position ) ) ),
           projects:projects!projects_process_id_fkey ( count )`,
        )
        .eq("id", id)
        .maybeSingle()
      if (error) throw error
      return data ? sortTree(data as unknown as Process) : null
    },
  })
}

export function useRefreshProcesses() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: processKeys.all })
}

export function countOf(p: ProcessSummary) {
  const steps = p.phases.flatMap((ph) => ph.steps)
  return {
    phases: p.phases.length,
    steps: steps.length,
    tasks: steps.reduce((n, s) => n + (s.tasks?.[0]?.count ?? 0), 0),
    projects: p.projects?.[0]?.count ?? 0,
  }
}
