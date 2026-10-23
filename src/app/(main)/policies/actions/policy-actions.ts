"use server"

import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { revalidatePath } from "next/cache"

/**
 * Aturan kantor. Stakeholders write a draft and publish it as the next
 * version (publish_policy RPC); published versions are never edited. The
 * database enforces the same rules (RLS + freeze trigger).
 */

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export type PolicyDraftInput = {
  title: string
  category: string
  summary: string
  body: string
}

export type PublishInput = {
  changeSummary: string
  /** yyyy-MM-dd; empty = today. */
  effectiveAt: string
  notify: boolean
}

async function admin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const id = await resolveEffectiveUserId(supabase, user.id, user.email)
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle()
  return canManageByRole(data?.role) ? { supabase, userId: id } : null
}

const NOT_ALLOWED = "Hanya admin yang bisa mengelola aturan."

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return `${base || "aturan"}-${crypto.randomUUID().slice(0, 6)}`
}

function validate(input: PolicyDraftInput): string | null {
  if (!input.title.trim()) return "Judul aturan wajib diisi."
  if (input.title.trim().length > 160) return "Judul maksimal 160 karakter."
  if (!input.category.trim()) return "Pilih kategori."
  if (input.summary.length > 300) return "Ringkasan maksimal 300 karakter."
  if (input.body.length > 100_000) return "Isi aturan terlalu panjang."
  return null
}

function revalidate(id?: string) {
  revalidatePath("/policies")
  if (id) revalidatePath(`/policies/${id}`)
}

/** Creates the rule (when `id` is empty) or updates its draft. */
export async function savePolicyDraft(
  id: string | null,
  input: PolicyDraftInput,
): Promise<Result<{ id: string }>> {
  const ctx = await admin()
  if (!ctx) return { success: false, error: NOT_ALLOWED }
  const invalid = validate(input)
  if (invalid) return { success: false, error: invalid }
  const { supabase, userId } = ctx

  const draft = {
    title: input.title.trim(),
    summary: input.summary.trim() || null,
    body: input.body,
    created_by: userId,
  }

  let documentId: string
  if (!id) {
    const { data, error } = await supabase
      .from("policy_documents")
      .insert({
        slug: slugify(input.title),
        title: draft.title,
        summary: draft.summary,
        category: input.category.trim(),
        created_by: userId,
      })
      .select("id")
      .single()
    if (error || !data)
      return { success: false, error: "Gagal membuat aturan." }
    documentId = data.id
  } else {
    documentId = id
    const { error } = await supabase
      .from("policy_documents")
      .update({ category: input.category.trim() })
      .eq("id", documentId)
    if (error) return { success: false, error: "Gagal menyimpan aturan." }
  }

  const { data: existing } = await supabase
    .from("policy_versions")
    .select("id")
    .eq("document_id", documentId)
    .eq("status", "Draft")
    .maybeSingle()

  // Nothing changed from the version in force: no draft to keep.
  if (!existing && id) {
    const { data: doc } = await supabase
      .from("policy_documents")
      .select(
        "category, current:policy_versions!policy_documents_current_version_id_fkey ( title, summary, body )",
      )
      .eq("id", documentId)
      .maybeSingle()
    const current = doc?.current as unknown as {
      title: string
      summary: string | null
      body: string
    } | null
    if (
      current &&
      current.title === draft.title &&
      (current.summary ?? null) === draft.summary &&
      current.body.trimEnd() === draft.body.trimEnd()
    )
      return { success: true, data: { id: documentId } }
  }

  const { error } = existing
    ? await supabase.from("policy_versions").update(draft).eq("id", existing.id)
    : await supabase.from("policy_versions").insert({
        ...draft,
        document_id: documentId,
        version_number: "draft",
        status: "Draft",
      })
  if (error) return { success: false, error: "Gagal menyimpan draf." }

  revalidate(documentId)
  return { success: true, data: { id: documentId } }
}

export async function publishPolicy(
  id: string,
  input: PublishInput,
): Promise<Result> {
  const ctx = await admin()
  if (!ctx) return { success: false, error: NOT_ALLOWED }
  if (input.changeSummary.length > 300)
    return { success: false, error: "Catatan perubahan maksimal 300 karakter." }

  const { error } = await ctx.supabase.rpc("publish_policy", {
    p_document_id: id,
    p_change_summary: input.changeSummary.trim(),
    p_effective_at: input.effectiveAt
      ? new Date(`${input.effectiveAt}T00:00:00+07:00`).toISOString()
      : undefined,
    p_notify: input.notify,
  })
  if (error) return { success: false, error: error.message }

  revalidate(id)
  return { success: true }
}

/** Drops the draft; a rule that was never published is removed entirely. */
export async function discardPolicyDraft(
  id: string,
): Promise<Result<{ deleted: boolean }>> {
  const ctx = await admin()
  if (!ctx) return { success: false, error: NOT_ALLOWED }
  const { supabase } = ctx

  const { data: doc } = await supabase
    .from("policy_documents")
    .select("current_version_id")
    .eq("id", id)
    .maybeSingle()
  if (!doc) return { success: false, error: "Aturan tidak ditemukan." }

  const { error } = doc.current_version_id
    ? await supabase
        .from("policy_versions")
        .delete()
        .eq("document_id", id)
        .eq("status", "Draft")
    : await supabase.from("policy_documents").delete().eq("id", id)
  if (error) return { success: false, error: "Gagal membuang draf." }

  revalidate(id)
  return { success: true, data: { deleted: !doc.current_version_id } }
}

export async function setPolicyArchived(
  id: string,
  archived: boolean,
): Promise<Result> {
  const ctx = await admin()
  if (!ctx) return { success: false, error: NOT_ALLOWED }
  const { error } = await ctx.supabase
    .from("policy_documents")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
  if (error) return { success: false, error: "Gagal mengubah status aturan." }
  revalidate(id)
  return { success: true }
}

export async function deletePolicy(id: string): Promise<Result> {
  const ctx = await admin()
  if (!ctx) return { success: false, error: NOT_ALLOWED }
  const { error } = await ctx.supabase
    .from("policy_documents")
    .delete()
    .eq("id", id)
  if (error) return { success: false, error: "Gagal menghapus aturan." }
  revalidate(id)
  return { success: true }
}
