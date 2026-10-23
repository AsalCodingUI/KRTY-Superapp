"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { canManageByRole } from "@/shared/lib/roles"
import {
  moveUnique,
  slugify,
  splitFileName,
  uploadUnique,
} from "@/shared/lib/storage-names"
import type { Database } from "@/shared/types/database.types"
import { useQuery, useQueryClient } from "@tanstack/react-query"

/**
 * Data for the project pages. Reads and writes go straight through Supabase;
 * RLS decides access (stakeholders everything, project members read all and
 * work on steps, tasks and the library).
 */

type Tables = Database["public"]["Tables"]
export type ProjectRow = Tables["projects"]["Row"]
export type PhaseRow = Tables["project_phases"]["Row"]
export type StepRow = Tables["project_steps"]["Row"]
export type TaskRow = Tables["project_tasks"]["Row"]
export type DocumentRow = Tables["project_documents"]["Row"]
export type FolderRow = Tables["project_folders"]["Row"]
export type FileRow = Tables["project_files"]["Row"]

export type TeamMember = {
  assignmentId: string
  id: string
  full_name: string | null
  avatar_url: string | null
  job_title: string | null
  role: string
  isLead: boolean
}

export const supabase = () => createClient()

export const keys = {
  workspace: (id: string) => ["project-workspace", id] as const,
  steps: (id: string) => ["project-steps", id] as const,
  tasks: (id: string) => ["project-tasks", id] as const,
  documents: (id: string) => ["project-documents", id] as const,
  library: (id: string) => ["project-library", id] as const,
}

export function useViewer() {
  const { profile } = useUserProfile()
  return {
    id: profile?.id ?? null,
    isAdmin: canManageByRole(profile?.role),
  }
}

/** The client a project is linked to (`projects.client_id` → `clients`). */
export type ProjectClient = {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  country: string | null
  currency: string
}

export function useWorkspace(projectId: string) {
  return useQuery({
    queryKey: keys.workspace(projectId),
    queryFn: async () => {
      const db = supabase()
      const [{ data: project }, { data: team }, { data: phases }] =
        await Promise.all([
          db
            .from("projects")
            .select(
              "*, client:clients!projects_client_id_fkey ( id, name, contact_name, email, phone, address, country, currency )",
            )
            .eq("id", projectId)
            .maybeSingle(),
          db
            .from("project_assignments")
            .select(
              "id, role_in_project, is_lead, profiles!project_assignments_user_id_fkey ( id, full_name, avatar_url, job_title )",
            )
            .eq("project_id", projectId),
          db
            .from("project_phases")
            .select("*")
            .eq("project_id", projectId)
            .order("position"),
        ])
      type Assignment = {
        id: string
        role_in_project: string
        is_lead: boolean | null
        profiles: {
          id: string
          full_name: string | null
          avatar_url: string | null
          job_title: string | null
        } | null
      }
      const { client, ...row } = (project ?? {}) as ProjectRow & {
        client: ProjectClient | null
      }
      return {
        project: project ? (row as ProjectRow) : null,
        /** The linked client, read from `clients` (the one source). */
        client: client ?? null,
        phases: (phases ?? []) as PhaseRow[],
        team: ((team ?? []) as unknown as Assignment[])
          .filter((a) => a.profiles)
          .map(
            (a): TeamMember => ({
              assignmentId: a.id,
              ...a.profiles!,
              role: a.role_in_project,
              isLead: a.is_lead === true,
            }),
          )
          .sort((a, b) => Number(b.isLead) - Number(a.isLead)),
      }
    },
  })
}

export function useSteps(projectId: string) {
  return useQuery({
    queryKey: keys.steps(projectId),
    queryFn: async () => {
      const { data } = await supabase()
        .from("project_steps")
        .select("*")
        .eq("project_id", projectId)
        .order("position")
        .order("created_at")
      return (data ?? []) as StepRow[]
    },
  })
}

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: keys.tasks(projectId),
    queryFn: async () => {
      const { data } = await supabase()
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at")
      return (data ?? []) as TaskRow[]
    },
  })
}

export function useDocuments(projectId: string) {
  return useQuery({
    queryKey: keys.documents(projectId),
    queryFn: async () => {
      const { data } = await supabase()
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
      return (data ?? []) as DocumentRow[]
    },
  })
}

export function useLibrary(projectId: string) {
  return useQuery({
    queryKey: keys.library(projectId),
    queryFn: async () => {
      const db = supabase()
      const [{ data: folders }, { data: files }] = await Promise.all([
        db
          .from("project_folders")
          .select("*")
          .eq("project_id", projectId)
          .order("name"),
        db
          .from("project_files")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
      ])
      return {
        folders: (folders ?? []) as FolderRow[],
        files: (files ?? []) as FileRow[],
      }
    },
  })
}

export function useInvalidate(projectId: string) {
  const queryClient = useQueryClient()
  return (...which: (keyof typeof keys)[]) =>
    Promise.all(
      which.map((k) =>
        queryClient.invalidateQueries({ queryKey: keys[k](projectId) }),
      ),
    )
}

export const BUCKET = "project-files"

/** "<project-slug>--<project-id>/<library|dokumen>" (RLS reads the id). */
export function projectFileDir(
  projectId: string,
  projectName: string,
  area: "documents" | "library",
) {
  return `${slugify(projectName, 40)}--${projectId}/${
    area === "documents" ? "dokumen" : "library"
  }`
}

/**
 * Uploads under a readable path, e.g.
 * "milxa--<id>/library/logo-final.png" ("-2" if the name is taken).
 */
export async function uploadProjectFile(
  projectId: string,
  projectName: string,
  area: "documents" | "library",
  file: File,
) {
  const { base, ext } = splitFileName(file.name)
  return uploadUnique(
    supabase(),
    BUCKET,
    projectFileDir(projectId, projectName, area),
    slugify(base),
    ext,
    file,
  )
}

/** Renames the stored file to match a new display name; returns the path. */
export async function renameProjectFile(path: string, displayName: string) {
  const { base, ext } = splitFileName(displayName)
  const current = splitFileName(path.slice(path.lastIndexOf("/") + 1))
  return moveUnique(supabase(), BUCKET, path, slugify(base), ext || current.ext)
}

/** Short-lived link to open or download a private file. */
export async function openProjectFile(path: string, download?: string) {
  const { data, error } = await supabase()
    .storage.from(BUCKET)
    .createSignedUrl(path, 60, download ? { download } : undefined)
  if (error || !data) throw error ?? new Error("no url")
  window.open(data.signedUrl, "_blank", "noopener")
}

export function formatBytes(bytes: number | null) {
  if (!bytes) return "—"
  const units = ["B", "KB", "MB", "GB"]
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

/**
 * A signed URL for showing a private file inline (thumbnails, previews).
 * Lives an hour and is cached a little less, so grids don't re-sign.
 */
export function useFileUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["project-file-url", path],
    enabled: Boolean(path),
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase()
        .storage.from(BUCKET)
        .createSignedUrl(path!, 60 * 60)
      if (error || !data) throw error ?? new Error("no url")
      return data.signedUrl
    },
  })
}
