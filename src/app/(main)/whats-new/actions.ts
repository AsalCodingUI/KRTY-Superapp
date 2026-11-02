"use server"

import {
  WHATS_NEW_AREAS,
  WHATS_NEW_AUDIENCES,
  WHATS_NEW_SURFACES,
  WHATS_NEW_TAGS,
} from "@/page-slices/whats-new/model/types"
import { getT } from "@/shared/i18n/server"
import { getAdminContext } from "@/shared/lib/admin-server"
import { revalidatePath } from "next/cache"

/**
 * Yang baru entries: stakeholders write them (the database agrees: RLS in
 * migrations/whats_new_entries.sql). The id is the entry's slug, made from
 * the title on create and fixed after (it's the URL and the "seen" mark).
 */

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export type WhatsNewInput = {
  title: string
  summary: string
  /** yyyy-MM-dd */
  date: string
  tags: string[]
  area: string
  audience: string
  surface: string
  thumbnailUrl: string | null
  body: string
  published: boolean
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "")
}

type T = Awaited<ReturnType<typeof getT<"whatsNew">>>

function clean(input: WhatsNewInput, t: T) {
  const title = input.title.trim()
  if (!title) return { error: t("errTitleRequired") }
  if (title.length > 160) return { error: t("errTitleTooLong") }
  if (input.summary.length > 400) return { error: t("errSummaryTooLong") }
  if (input.body.length > 200_000) return { error: t("errBodyTooLong") }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
    return { error: t("errDateRequired") }
  const thumb = input.thumbnailUrl?.trim() || null
  if (thumb && !/^(https:\/\/|\/(?!\/))/.test(thumb))
    return { error: t("errThumbnail") }
  const tags = WHATS_NEW_TAGS.filter((tag) => input.tags.includes(tag))
  return {
    row: {
      title,
      summary: input.summary.trim(),
      date: input.date,
      tags: tags.length ? tags : ["new"],
      area: (WHATS_NEW_AREAS as readonly string[]).includes(input.area)
        ? input.area
        : "general",
      audience: (WHATS_NEW_AUDIENCES as readonly string[]).includes(
        input.audience,
      )
        ? input.audience
        : "everyone",
      surface: (WHATS_NEW_SURFACES as readonly string[]).includes(input.surface)
        ? input.surface
        : "app",
      thumbnail_url: thumb,
      body: input.body,
      published: input.published,
    },
  }
}

function revalidate(id?: string) {
  revalidatePath("/whats-new")
  if (id) revalidatePath(`/whats-new/${id}`)
}

/** Creates the entry (no `id`) or updates it; returns its id. */
export async function saveWhatsNewEntry(
  id: string | null,
  input: WhatsNewInput,
): Promise<Result<{ id: string }>> {
  const [t, ctx] = await Promise.all([getT("whatsNew"), getAdminContext()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const cleaned = clean(input, t)
  if ("error" in cleaned) return { success: false, error: cleaned.error! }
  const { supabase } = ctx

  if (id) {
    const { error } = await supabase
      .from("whats_new_entries")
      .update(cleaned.row)
      .eq("id", id)
    if (error) return { success: false, error: t("errSaveFailed") }
    revalidate(id)
    return { success: true, data: { id } }
  }

  // New: first on its day, a slug that isn't taken yet.
  const base = slugify(cleaned.row.title) || "update"
  const [{ data: taken }, { data: first }] = await Promise.all([
    supabase.from("whats_new_entries").select("id").like("id", `${base}%`),
    supabase
      .from("whats_new_entries")
      .select("sort")
      .eq("date", cleaned.row.date)
      .order("sort", { ascending: true })
      .limit(1),
  ])
  const used = new Set((taken ?? []).map((r: { id: string }) => r.id))
  let slug = base
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`
  const { error } = await supabase.from("whats_new_entries").insert({
    id: slug,
    ...cleaned.row,
    sort: (first?.[0]?.sort ?? 1) - 1,
    created_by: ctx.userId,
  })
  if (error) return { success: false, error: t("errSaveFailed") }
  revalidate(slug)
  return { success: true, data: { id: slug } }
}

export async function deleteWhatsNewEntry(id: string): Promise<Result> {
  const [t, ctx] = await Promise.all([getT("whatsNew"), getAdminContext()])
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const { error, count } = await ctx.supabase
    .from("whats_new_entries")
    .delete({ count: "exact" })
    .eq("id", id)
  if (error || !count) return { success: false, error: t("errDeleteFailed") }
  revalidate(id)
  return { success: true }
}
