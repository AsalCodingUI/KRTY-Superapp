"use server"

import { createClient } from "@/shared/api/supabase/server"

export type PolicyStatus = "Draft" | "Published" | "Archived"
export type PolicyAudience =
  | "Everyone"
  | "Stakeholder"
  | "Employee"
  | "Project Team"

export type PolicyContentBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "note"; text: string }

export type PolicyVersionRecord = {
  id: string
  versionNumber: string
  status: PolicyStatus
  changeSummary: string
  createdAt: string
  effectiveDate?: string
}

export type PolicyDocument = {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  audience: PolicyAudience
  ownerLabel: string
  content: unknown
  latestVersion: string
  latestStatus: PolicyStatus
  updatedAt: string
  effectiveDate?: string
  requiresAcknowledgement?: boolean
  currentVersionId: string | null
  versionId: string | null
  archivedAt?: string | null
  versions: PolicyVersionRecord[]
}

export type SavePolicyPayload = {
  title: string
  category: string
  summary: string
  ownerRole: string
  audience: PolicyAudience
  content: unknown
  changeSummary?: string
  effectiveDate?: string
  publishImmediately?: boolean
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim() +
    "-" +
    Date.now().toString(36)
  )
}

function mapRow(row: {
  id: string
  slug: string
  title: string
  category: string
  summary: string | null
  owner_role: string | null
  audience: string
  archived_at: string | null
  updated_at: string
  current_version_id: string | null
  current_version: {
    id: string
    version_number: string
    status: string
    content: unknown
    change_summary: string | null
    effective_at: string | null
  } | null
  versions: {
    id: string
    version_number: string
    status: string
    change_summary: string | null
    effective_at: string | null
    created_at: string
  }[]
}): PolicyDocument {
  const cv = row.current_version
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.summary ?? "",
    audience: (row.audience as PolicyAudience) ?? "Everyone",
    ownerLabel: row.owner_role ?? "",
    content: cv?.content ?? null,
    latestVersion: cv?.version_number ?? "v1.0",
    latestStatus: (cv?.status as PolicyStatus) ?? "Draft",
    updatedAt: row.updated_at,
    effectiveDate: cv?.effective_at ?? undefined,
    requiresAcknowledgement: row.audience === "Everyone",
    currentVersionId: row.current_version_id,
    versionId: cv?.id ?? null,
    archivedAt: row.archived_at,
    versions: (row.versions ?? [])
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .map((v) => ({
        id: v.id,
        versionNumber: v.version_number,
        status: v.status as PolicyStatus,
        changeSummary: v.change_summary ?? "",
        createdAt: v.created_at,
        effectiveDate: v.effective_at ?? undefined,
      })),
  }
}

export async function getPolicies(includeArchived = false) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("policy_documents")
    .select(
      `id, slug, title, category, summary, owner_role, audience, archived_at, updated_at, current_version_id,
       current_version:policy_versions!current_version_id(id, version_number, status, content, change_summary, effective_at),
       versions:policy_versions(id, version_number, status, change_summary, effective_at, created_at)`,
    )
    .order("updated_at", { ascending: false })

  if (!includeArchived) {
    query = query.is("archived_at", null)
  }

  const { data, error } = await query

  if (error) {
    return { success: false as const, error: error.message, data: [] }
  }

  return {
    success: true as const,
    data: ((data as unknown[]) ?? []).map((r) => mapRow(r as Parameters<typeof mapRow>[0])),
  }
}

export async function createPolicy(
  payload: SavePolicyPayload,
  createdBy: string,
) {
  const supabase = await createClient()
  const slug = generateSlug(payload.title)
  const status = payload.publishImmediately ? "Published" : "Draft"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc, error: docError } = await (supabase as any)
    .from("policy_documents")
    .insert({
      slug,
      title: payload.title,
      category: payload.category,
      summary: payload.summary,
      owner_role: payload.ownerRole,
      audience: payload.audience,
      created_by: createdBy,
    })
    .select("id")
    .single()

  if (docError) {
    return { success: false as const, error: docError.message }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: version, error: versionError } = await (supabase as any)
    .from("policy_versions")
    .insert({
      document_id: doc.id,
      version_number: "v1.0",
      status,
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
      change_summary: payload.changeSummary ?? null,
      effective_at: payload.effectiveDate ?? null,
      published_at: status === "Published" ? new Date().toISOString() : null,
      created_by: createdBy,
    })
    .select("id")
    .single()

  if (versionError) {
    return { success: false as const, error: versionError.message }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: linkError } = await (supabase as any)
    .from("policy_documents")
    .update({ current_version_id: version.id })
    .eq("id", doc.id)

  if (linkError) {
    return { success: false as const, error: linkError.message }
  }

  return { success: true as const }
}

export async function updatePolicy(
  documentId: string,
  versionId: string,
  payload: SavePolicyPayload,
) {
  const supabase = await createClient()
  const status = payload.publishImmediately ? "Published" : "Draft"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: docError } = await (supabase as any)
    .from("policy_documents")
    .update({
      title: payload.title,
      category: payload.category,
      summary: payload.summary,
      owner_role: payload.ownerRole,
      audience: payload.audience,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)

  if (docError) {
    return { success: false as const, error: docError.message }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: versionError } = await (supabase as any)
    .from("policy_versions")
    .update({
      title: payload.title,
      summary: payload.summary,
      content: payload.content,
      change_summary: payload.changeSummary ?? null,
      effective_at: payload.effectiveDate ?? null,
      status,
      published_at:
        status === "Published" ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", versionId)

  if (versionError) {
    return { success: false as const, error: versionError.message }
  }

  return { success: true as const }
}

export async function archivePolicy(documentId: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("policy_documents")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", documentId)

  if (error) {
    return { success: false as const, error: error.message }
  }
  return { success: true as const }
}

export async function deletePolicy(documentId: string) {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("policy_documents")
    .delete()
    .eq("id", documentId)

  if (error) {
    return { success: false as const, error: error.message }
  }
  return { success: true as const }
}
