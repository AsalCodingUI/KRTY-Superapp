"use server"

import { getT } from "@/shared/i18n/server"
import { getAdminContext } from "@/shared/lib/admin-server"
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

const admin = getAdminContext

function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return `${base || "aturan"}-${crypto.randomUUID().slice(0, 6)}`
}

type T = Awaited<ReturnType<typeof getT<"policies">>>

function validate(input: PolicyDraftInput, t: T): string | null {
  if (!input.title.trim()) return t("errTitleRequired")
  if (input.title.trim().length > 160) return t("errTitleTooLong")
  if (!input.category.trim()) return t("errCategoryRequired")
  if (input.summary.length > 300) return t("errSummaryTooLong")
  if (input.body.length > 100_000) return t("errBodyTooLong")
  return null
}

function revalidate(id?: string) {
  revalidatePath("/policies")
  if (id) revalidatePath(`/policies/${id}`)
}

/**
 * Creates the rule (when `id` is empty) or updates its draft. `versionId` /
 * `updatedAt` describe the saved draft (absent when no draft was needed), so
 * the editor can update its cache without refetching.
 */
export async function savePolicyDraft(
  id: string | null,
  input: PolicyDraftInput,
): Promise<Result<{ id: string; versionId?: string; updatedAt?: string }>> {
  const [t, ctx] = await Promise.all([getT("policies"), admin()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const invalid = validate(input, t)
  if (invalid) return { success: false, error: invalid }
  const { supabase, userId } = ctx

  const draft = {
    title: input.title.trim(),
    summary: input.summary.trim() || null,
    body: input.body,
    created_by: userId,
  }

  const findDraft = (documentId: string) =>
    supabase
      .from("policy_versions")
      .select("id")
      .eq("document_id", documentId)
      .eq("status", "Draft")
      .maybeSingle()

  let documentId: string
  let existing: { id: string } | null
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
    if (error || !data) return { success: false, error: t("errCreateFailed") }
    documentId = data.id
    existing = (await findDraft(documentId)).data
  } else {
    documentId = id
    // Independent: the category update, the open draft, the version in force.
    const [{ error }, { data: openDraft }, { data: doc }] = await Promise.all([
      supabase
        .from("policy_documents")
        .update({ category: input.category.trim() })
        .eq("id", documentId),
      findDraft(documentId),
      supabase
        .from("policy_documents")
        .select(
          "current:policy_versions!policy_documents_current_version_id_fkey ( title, summary, body )",
        )
        .eq("id", documentId)
        .maybeSingle(),
    ])
    if (error) return { success: false, error: t("errSaveFailed") }
    existing = openDraft

    // Nothing changed from the version in force: no draft to keep.
    if (!existing) {
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
  }

  const { data: saved, error } = existing
    ? await supabase
        .from("policy_versions")
        .update(draft)
        .eq("id", existing.id)
        .select("id, updated_at")
        .maybeSingle()
    : await supabase
        .from("policy_versions")
        .insert({
          ...draft,
          document_id: documentId,
          version_number: "draft",
          status: "Draft",
        })
        .select("id, updated_at")
        .maybeSingle()
  if (error) return { success: false, error: t("errSaveDraftFailed") }

  // No revalidatePath: /policies renders no server data (client-fetched).
  return {
    success: true,
    data: {
      id: documentId,
      versionId: saved?.id,
      updatedAt: saved?.updated_at ?? undefined,
    },
  }
}

export async function publishPolicy(
  id: string,
  input: PublishInput,
): Promise<Result> {
  const [t, ctx] = await Promise.all([getT("policies"), admin()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  if (input.changeSummary.length > 300)
    return { success: false, error: t("errNoteTooLong") }

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
  const [t, ctx] = await Promise.all([getT("policies"), admin()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const { supabase } = ctx

  const { data: doc } = await supabase
    .from("policy_documents")
    .select("current_version_id")
    .eq("id", id)
    .maybeSingle()
  if (!doc) return { success: false, error: t("errNotFound") }

  const { error } = doc.current_version_id
    ? await supabase
        .from("policy_versions")
        .delete()
        .eq("document_id", id)
        .eq("status", "Draft")
    : await supabase.from("policy_documents").delete().eq("id", id)
  if (error) return { success: false, error: t("errDiscardFailed") }

  revalidate(id)
  return { success: true, data: { deleted: !doc.current_version_id } }
}

export async function setPolicyArchived(
  id: string,
  archived: boolean,
): Promise<Result> {
  const [t, ctx] = await Promise.all([getT("policies"), admin()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const { error } = await ctx.supabase
    .from("policy_documents")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
  if (error) return { success: false, error: t("errArchiveFailed") }
  revalidate(id)
  return { success: true }
}

export async function deletePolicy(id: string): Promise<Result> {
  const [t, ctx] = await Promise.all([getT("policies"), admin()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const { error } = await ctx.supabase
    .from("policy_documents")
    .delete()
    .eq("id", id)
  if (error) return { success: false, error: t("errDeleteFailed") }
  revalidate(id)
  return { success: true }
}
