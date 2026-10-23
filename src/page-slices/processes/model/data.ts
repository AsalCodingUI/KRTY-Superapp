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

export const processKeys = {
  all: ["processes"] as const,
  list: () => ["processes", "list"] as const,
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

/** Every process with its full tree (stakeholders only; templates are small). */
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
           phases:process_phases ( id, name, description, position,
             steps:process_steps ( id, title, description, position,
               tasks:process_tasks ( id, title, position ) ) ),
           projects:projects!projects_process_id_fkey ( count )`,
        )
        .order("is_default", { ascending: false })
        .order("name")
      if (error) throw error
      return ((data ?? []) as unknown as Process[]).map(sortTree)
    },
  })
}

export function useRefreshProcesses() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: processKeys.all })
}

export function countOf(p: Process) {
  const steps = p.phases.flatMap((ph) => ph.steps)
  return {
    phases: p.phases.length,
    steps: steps.length,
    tasks: steps.reduce((n, s) => n + s.tasks.length, 0),
    projects: p.projects?.[0]?.count ?? 0,
  }
}
