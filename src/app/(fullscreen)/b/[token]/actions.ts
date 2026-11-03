"use server"

import { createAdminClient } from "@/shared/api/supabase/admin"
import { briefProgress, visibleSections } from "@/shared/lib/briefs/brief"
import {
  attachBriefFiles,
  BRIEF_BUCKET,
  briefByToken,
  notifyBriefTeam,
  type BriefRow,
} from "@/shared/lib/briefs/server"
import { SET_TITLES } from "@/shared/lib/briefs/templates"
import {
  BRIEF_SETS,
  isLayout,
  type BriefAnswers,
  type BriefSet,
} from "@/shared/lib/briefs/types"

type Result = { ok: true; savedAt?: string } | { ok: false; error: string }

const MAX_TEXT = 20_000

/** Only answers to the brief's questions, in their shapes. Every set's
 *  answers are kept, so dropping an extra and taking it back loses nothing
 *  (what the team sees and checks follows the sets asked). */
function clean(brief: BriefRow, answers: BriefAnswers) {
  const out: BriefAnswers = {}
  for (const q of visibleSections(brief.sections, [...BRIEF_SETS]).flatMap(
    (s) => s.questions,
  )) {
    if (isLayout(q.type)) continue
    const value = answers[q.id]
    if (q.type === "multi") {
      if (Array.isArray(value))
        out[q.id] = value
          .filter((v) => typeof v === "string")
          .slice(0, 50)
          .map((v) => v.slice(0, 500))
    } else if (typeof value === "string") {
      out[q.id] = value.slice(0, MAX_TEXT)
    }
    const other = answers[`${q.id}__other`]
    if (q.other && typeof other === "string")
      out[`${q.id}__other`] = other.slice(0, 2000)
  }
  return out
}

/** Autosave: the client's answers as they type (a draft until sent). */
export async function saveBriefAnswers(
  token: string,
  answers: BriefAnswers,
): Promise<Result> {
  const brief = await briefByToken(token)
  if (!brief) return { ok: false, error: "This link is no longer active." }
  const savedAt = new Date().toISOString()
  const { error } = await createAdminClient()
    .from("briefs")
    .update({
      answers: clean(brief, answers),
      saved_at: savedAt,
      ...(brief.status === "draft" || brief.status === "sent"
        ? { status: "in_progress" }
        : {}),
    })
    .eq("id", brief.id)
  if (error) return { ok: false, error: "Couldn't save. We'll try again." }
  return { ok: true, savedAt }
}

/**
 * An extra the team offered ("Need branding too?"): taken (its questions
 * join the brief) or not. The client can change their mind either way: a
 * taken extra can be dropped again, a declined one taken after all. The
 * sets the team asked for can't be dropped.
 */
export async function answerBriefOffer(
  token: string,
  set: string,
  yes: boolean,
): Promise<Result> {
  const brief = await briefByToken(token)
  if (!brief || !(BRIEF_SETS as readonly string[]).includes(set))
    return { ok: false, error: "This link is no longer active." }
  const accepted = brief.accepted ?? []
  const open = brief.offers.includes(set) || brief.declined.includes(set)
  if (yes ? !open : !open && !accepted.includes(set)) return { ok: true }
  const without = (list: string[]) => list.filter((s) => s !== set)
  const { error } = await createAdminClient()
    .from("briefs")
    .update(
      yes
        ? {
            offers: without(brief.offers),
            declined: without(brief.declined),
            sets: [...without(brief.sets), set],
            accepted: [...without(accepted), set],
          }
        : {
            offers: without(brief.offers),
            declined: [...without(brief.declined), set],
            sets: accepted.includes(set) ? without(brief.sets) : brief.sets,
            accepted: without(accepted),
          },
    )
    .eq("id", brief.id)
  if (error)
    return { ok: false, error: "Couldn't save that. Please try again." }
  const name = brief.client?.name ?? "Klien"
  const what = SET_TITLES[set as BriefSet]
  if (yes)
    await notifyBriefTeam(brief, {
      type: "brief_offer",
      title: `${name} mau ${what} juga`,
      message: `Tawaran di “${brief.title}” diterima, pertanyaannya lagi diisi.`,
    })
  else if (accepted.includes(set))
    await notifyBriefTeam(brief, {
      type: "brief_offer",
      title: `${name} batal ambil ${what}`,
      message: `Tawaran di “${brief.title}” nggak jadi diambil.`,
    })
  return { ok: true }
}

/** Sends the brief to the team (it can still be updated afterwards). */
export async function submitBrief(
  token: string,
  answers: BriefAnswers,
): Promise<Result> {
  const brief = await briefByToken(token)
  if (!brief) return { ok: false, error: "This link is no longer active." }
  const admin = createAdminClient()
  const kept = clean(brief, answers)
  const { data: files } = await admin
    .from("brief_files")
    .select("id, name, file_size, question_id")
    .eq("brief_id", brief.id)
  const { missing } = briefProgress(
    brief.sections,
    brief.sets,
    kept,
    files ?? [],
  )
  if (missing.length)
    return {
      ok: false,
      error: `A few answers are still missing: ${missing
        .slice(0, 3)
        .map((q) => q.label)
        .join(", ")}${missing.length > 3 ? "…" : ""}`,
    }
  const first = brief.status !== "submitted"
  const now = new Date().toISOString()
  const { error } = await admin
    .from("briefs")
    .update({
      answers: kept,
      saved_at: now,
      status: "submitted",
      ...(first ? { submitted_at: now } : {}),
    })
    .eq("id", brief.id)
  if (error) return { ok: false, error: "Couldn't send it. Please try again." }
  await attachBriefFiles(brief.id)
  await notifyBriefTeam(brief, {
    type: "brief_submitted",
    title: first
      ? `${brief.client?.name ?? "Klien"} udah ngisi brief`
      : `${brief.client?.name ?? "Klien"} ngubah jawaban brief`,
    message: `“${brief.title}” siap dibaca.`,
  })
  return { ok: true, savedAt: now }
}

/** Removes one of the client's uploads (also from the project library). */
export async function deleteBriefFile(
  token: string,
  fileId: string,
): Promise<Result> {
  const brief = await briefByToken(token)
  if (!brief) return { ok: false, error: "This link is no longer active." }
  const admin = createAdminClient()
  const { data: file } = await admin
    .from("brief_files")
    .select("id, file_path, project_file_id")
    .eq("id", fileId)
    .eq("brief_id", brief.id)
    .maybeSingle()
  if (!file) return { ok: true }
  await admin.storage.from(BRIEF_BUCKET).remove([file.file_path])
  if (file.project_file_id)
    await admin.from("project_files").delete().eq("id", file.project_file_id)
  await admin.from("brief_files").delete().eq("id", file.id)
  return { ok: true }
}
