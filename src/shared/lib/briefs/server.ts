// Server only (service key): the client site and the team's actions.
import { createAdminClient } from "@/shared/api/supabase/admin"
import { slugify, splitFileName } from "@/shared/lib/storage-names"
import type { BriefAnswers, BriefSection } from "./types"

export const BRIEF_BUCKET = "project-files"
/** The client-visible library folder their uploads land in. */
export const CLIENT_ASSETS_FOLDER = "Aset dari klien"

export type BriefRow = {
  id: string
  title: string
  token: string
  client_id: string
  project_id: string | null
  sets: string[]
  offers: string[]
  declined: string[]
  /** Offers the client took (they can drop them again). */
  accepted: string[]
  sections: BriefSection[]
  answers: BriefAnswers
  status: string
  submitted_at: string | null
  created_by: string | null
  client: { name: string; contact_name: string | null } | null
}

/** A brief by its secret link (the client site; no account). */
export async function briefByToken(token: string) {
  if (!/^[\w-]{16,64}$/.test(token)) return null
  const { data } = await createAdminClient()
    .from("briefs")
    .select(
      "id, title, token, client_id, project_id, sets, offers, declined, accepted, sections, answers, status, submitted_at, created_by, client:clients ( name, contact_name )",
    )
    .eq("token", token)
    .maybeSingle()
  return (data as unknown as BriefRow | null) ?? null
}

/** Where a brief's uploads go: the project's library once it has one. */
export async function briefFileDir(brief: {
  id: string
  project_id: string | null
}) {
  if (!brief.project_id) return `briefs/${brief.id}`
  const { data } = await createAdminClient()
    .from("projects")
    .select("name")
    .eq("id", brief.project_id)
    .maybeSingle()
  return `${slugify(data?.name ?? "project", 40)}--${brief.project_id}/library/aset-klien`
}

/** "<dir>/<slug>.<ext>", or "-2", "-3"… when taken. */
export async function freePath(dir: string, fileName: string) {
  const { base, ext: bare } = splitFileName(fileName)
  const ext = bare ? `.${bare}` : ""
  const stem = slugify(base) || "file"
  const admin = createAdminClient()
  const { data } = await admin.storage
    .from(BRIEF_BUCKET)
    .list(dir, { limit: 1000 })
  const taken = new Set((data ?? []).map((o) => o.name))
  for (let n = 1; n < 500; n++) {
    const name = `${stem}${n > 1 ? `-${n}` : ""}${ext}`
    if (!taken.has(name)) return `${dir}/${name}`
  }
  return `${dir}/${stem}-${Date.now()}${ext}`
}

/** The project's "Aset dari klien" folder (made, visible to the client). */
async function clientAssetsFolder(projectId: string) {
  const admin = createAdminClient()
  const { data: found } = await admin
    .from("project_folders")
    .select("id")
    .eq("project_id", projectId)
    .eq("name", CLIENT_ASSETS_FOLDER)
    .maybeSingle()
  if (found) return found.id
  const { data } = await admin
    .from("project_folders")
    .insert({
      project_id: projectId,
      name: CLIENT_ASSETS_FOLDER,
      is_internal: false,
    })
    .select("id")
    .single()
  return data?.id ?? null
}

/**
 * Puts a project brief's uploads in the project's library ("Aset dari
 * klien", which the client portal shows too): files not there yet move
 * into the project's folder and get a library row. Safe to run again.
 */
export async function attachBriefFiles(briefId: string) {
  const admin = createAdminClient()
  const { data: brief } = await admin
    .from("briefs")
    .select("id, project_id, created_by")
    .eq("id", briefId)
    .maybeSingle()
  if (!brief?.project_id) return 0
  const { data: files } = await admin
    .from("brief_files")
    .select("id, name, file_path, file_size, mime_type")
    .eq("brief_id", briefId)
    .is("project_file_id", null)
  if (!files?.length) return 0
  const folderId = await clientAssetsFolder(brief.project_id)
  const dir = await briefFileDir(brief)
  let count = 0
  for (const file of files) {
    let path = file.file_path
    if (!path.startsWith(`${dir}/`)) {
      const next = await freePath(dir, file.name)
      const { error } = await admin.storage.from(BRIEF_BUCKET).move(path, next)
      if (error) continue
      path = next
    }
    const { data: row } = await admin
      .from("project_files")
      .insert({
        project_id: brief.project_id,
        folder_id: folderId,
        name: file.name,
        file_path: path,
        file_size: file.file_size,
        mime_type: file.mime_type,
        created_by: brief.created_by,
      })
      .select("id")
      .single()
    if (!row) continue
    await admin
      .from("brief_files")
      .update({ project_file_id: row.id, file_path: path })
      .eq("id", file.id)
    count++
  }
  return count
}

/**
 * A notice to whoever runs the brief: the person who made it and the
 * project's PMs (once there is a project).
 */
export async function notifyBriefTeam(
  brief: { id: string; project_id: string | null; created_by: string | null },
  notice: { type: string; title: string; message: string },
) {
  const admin = createAdminClient()
  const to = new Set<string>()
  if (brief.created_by) to.add(brief.created_by)
  if (brief.project_id) {
    const { data } = await admin
      .from("project_assignments")
      .select("user_id")
      .eq("project_id", brief.project_id)
      .eq("role_in_project", "Project Manager")
    for (const row of data ?? []) to.add(row.user_id)
  }
  if (!to.size) return
  await admin.from("notifications").insert(
    [...to].map((user_id) => ({
      user_id,
      type: notice.type,
      title: notice.title,
      message: notice.message,
      link: `/projects?scope=docs&brief=${brief.id}`,
      actor_id: null,
    })),
  )
}
