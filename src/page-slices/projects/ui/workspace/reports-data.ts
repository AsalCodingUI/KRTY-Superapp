"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { compressImage } from "@/shared/lib/compress-image"
import { supabase } from "./data"

/**
 * Daily reports of a project (project_reports): Markdown with images,
 * newest first. Each can be shared alone with the client (/r/<token>).
 */

export type Report = {
  id: string
  project_id: string
  author_id: string | null
  title: string
  body: string
  report_date: string
  share_token: string | null
  shared_at: string | null
  created_at: string
  updated_at: string
  author: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
}

// Not in the generated types yet.
const TABLE = "project_reports" as never
const COLUMNS =
  "id, project_id, author_id, title, body, report_date, share_token, shared_at, created_at, updated_at, author:profiles!project_reports_author_id_fkey ( id, full_name, avatar_url )"

export const reportKeys = {
  list: (projectId: string) => ["project-reports", projectId] as const,
}

export function useReports(projectId: string) {
  return useQuery({
    queryKey: reportKeys.list(projectId),
    queryFn: async () => {
      const { data, error } = await supabase()
        .from(TABLE)
        .select(COLUMNS)
        .eq("project_id" as never, projectId as never)
        .order("report_date", { ascending: false })
        .order("created_at", { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as Report[]
    },
  })
}

export function useInvalidateReports(projectId: string) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: reportKeys.list(projectId) })
}

export async function createReport(input: {
  projectId: string
  authorId: string
  title: string
  body: string
}) {
  const { data, error } = await supabase()
    .from(TABLE)
    .insert({
      project_id: input.projectId,
      author_id: input.authorId,
      title: input.title,
      body: input.body,
    } as never)
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data as unknown as Report
}

export async function updateReport(
  id: string,
  patch: Partial<Pick<Report, "title" | "body" | "share_token" | "shared_at">>,
) {
  const { data, error } = await supabase()
    .from(TABLE)
    .update(patch as never)
    .eq("id", id)
    .select(COLUMNS)
    .single()
  if (error) throw error
  return data as unknown as Report
}

/**
 * Deletes the report, then the pictures only it used. Attachments
 * (doc-files) are shared with notes and tasks, so they stay; a picture
 * another report also shows stays too.
 */
export async function deleteReport(report: Pick<Report, "id" | "body">) {
  const db = supabase()
  const { data, error } = await db
    .from(TABLE)
    .delete()
    .eq("id", report.id)
    .select("id")
  if (error) throw error
  // Row-level security denies by deleting nothing, without an error.
  if (!data?.length) throw new Error("report not deleted")
  const paths = [
    ...report.body.matchAll(
      new RegExp(
        `/storage/v1/object/public/${REPORT_IMAGES}/([^)\\s"#]+)`,
        "g",
      ),
    ),
  ].map((m) => decodeURIComponent(m[1]))
  const unused: string[] = []
  for (const path of new Set(paths)) {
    const { count } = await db
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .ilike("body" as never, `%${path}%` as never)
    if (!count) unused.push(path)
  }
  if (unused.length) await db.storage.from(REPORT_IMAGES).remove(unused)
}

/** A share token nobody can guess (24 random bytes, URL-safe). */
export function newShareToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export const REPORT_IMAGES = "report-images"

/** Uploads a picture for a report (compressed unless `original`); returns
 *  its public URL. */
export async function uploadReportImage(
  projectId: string,
  picked: File,
  original = false,
) {
  const file = original ? picked : await compressImage(picked)
  const ext = (file.name.split(".").pop() || "png").toLowerCase().slice(0, 5)
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`
  const db = supabase()
  const { error } = await db.storage
    .from(REPORT_IMAGES)
    .upload(path, file, { contentType: file.type || undefined })
  if (error) throw error
  return db.storage.from(REPORT_IMAGES).getPublicUrl(path).data.publicUrl
}

export const DOC_FILES = "doc-files"

/**
 * Uploads any other file dropped into a note, report or task description
 * (PDF, video, documents) under its own name; returns its public URL.
 */
export async function uploadDocFile(projectId: string, file: File) {
  // Storage keys take plain characters only; the link keeps the real name.
  const name =
    file.name
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-(?=\.)/g, "")
      .slice(-120) || "file"
  const path = `${projectId}/${crypto.randomUUID()}/${name}`
  const db = supabase()
  const { error } = await db.storage
    .from(DOC_FILES)
    .upload(path, file, { contentType: file.type || undefined })
  if (error) throw error
  return db.storage.from(DOC_FILES).getPublicUrl(path).data.publicUrl
}
