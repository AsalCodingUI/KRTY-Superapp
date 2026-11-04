"use server"

import { createClient } from "@/shared/api/supabase/server"
import { accessLevel, canRunProjects } from "@/shared/config/access"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { attachBriefFiles, BRIEF_BUCKET } from "@/shared/lib/briefs/server"
import { baseSections } from "@/shared/lib/briefs/templates"
import {
  BRIEF_SETS,
  type BriefAnswers,
  type BriefSet,
} from "@/shared/lib/briefs/types"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"

/**
 * Briefs (Dokumen), the team's side: stakeholders and PMs make them, link
 * them to a project and edit their questions (RLS says the same).
 */

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

async function manager() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const userId = await resolveEffectiveUserId(supabase, user.id, user.email)
  const { data } = await supabase
    .from("profiles")
    .select("role, job_title")
    .eq("id", userId)
    .maybeSingle()
  return canRunProjects(accessLevel(data)) ? { supabase, userId } : null
}

const onlySets = (list: string[]) =>
  BRIEF_SETS.filter((s) => list.includes(s)) as BriefSet[]

export type NewBrief = {
  title: string
  /** An existing client, or a new one by name (and email). */
  clientId: string | null
  /** name: the company; contact: the PIC. */
  newClient?: { name: string; contact: string; email: string } | null
  projectId: string | null
  sets: string[]
  offers: string[]
}

export async function createBrief(
  input: NewBrief,
): Promise<Result<{ id: string }>> {
  const ctx = await manager()
  if (!ctx)
    return {
      success: false,
      error: "Cuma PM dan stakeholder yang bisa bikin brief.",
    }
  const { supabase, userId } = ctx
  const sets = onlySets(input.sets)
  const offers = onlySets(input.offers).filter((s) => !sets.includes(s))
  if (!input.title.trim())
    return { success: false, error: "Judulnya diisi dulu." }
  if (!sets.length)
    return { success: false, error: "Pilih minimal satu set pertanyaan." }

  let clientId = input.clientId
  if (!clientId && input.newClient && !input.newClient.name.trim())
    return { success: false, error: "Nama perusahaan klien diisi dulu." }
  if (!clientId && input.newClient?.name.trim()) {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: input.newClient.name.trim(),
        contact_name: input.newClient.contact.trim() || null,
        email: input.newClient.email.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single()
    if (error)
      return {
        success: false,
        error:
          error.code === "23505"
            ? "Klien dengan nama itu udah ada, pilih dari daftar."
            : "Gagal nambah klien.",
      }
    clientId = data.id
  }
  // No client picked: the project's, when it's linked to one.
  if (!clientId && input.projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("client_id")
      .eq("id", input.projectId)
      .maybeSingle()
    clientId = project?.client_id ?? null
  }

  const { data: client } = clientId
    ? await supabase
        .from("clients")
        .select("name, contact_name, email, phone, country, website")
        .eq("id", clientId)
        .maybeSingle()
    : { data: null }
  // What we already know, so the client only checks it.
  const answers: BriefAnswers = {}
  if (client) {
    if (client.contact_name || client.name)
      answers.client_name = client.contact_name || client.name
    const contact = [client.email, client.phone].filter(Boolean).join(" · ")
    if (contact) answers.client_contact = contact
    if (client.country) answers.client_location = client.country
    answers.company_name = client.name
    if (client.website) answers.existing_product = client.website
  }

  const { data, error } = await supabase
    .from("briefs")
    .insert({
      title: input.title.trim(),
      client_id: clientId,
      project_id: input.projectId,
      sets,
      offers,
      sections: baseSections([...sets, ...offers]),
      answers,
      created_by: userId,
    })
    .select("id")
    .single()
  if (error)
    return {
      success: false,
      error: /at most two/.test(error.message)
        ? "Klien ini udah punya 2 brief (maksimal 2)."
        : "Gagal bikin brief.",
    }
  return { success: true, data: { id: data.id } }
}

/**
 * Links a brief to a project (or unlinks it). Its uploads move into the
 * project's library ("Aset dari klien", which the client portal shows).
 */
export async function setBriefProject(
  briefId: string,
  projectId: string | null,
): Promise<Result> {
  const ctx = await manager()
  if (!ctx) return { success: false, error: "Cuma PM dan stakeholder." }
  const { error } = await ctx.supabase
    .from("briefs")
    .update({ project_id: projectId })
    .eq("id", briefId)
  if (error) return { success: false, error: "Gagal menautkan project." }
  // A brief without a client takes the project's (unless that client
  // already has its two briefs).
  if (projectId) {
    const { data: brief } = await ctx.supabase
      .from("briefs")
      .select("client_id")
      .eq("id", briefId)
      .maybeSingle()
    if (brief && !brief.client_id) {
      const { data: project } = await ctx.supabase
        .from("projects")
        .select("client_id")
        .eq("id", projectId)
        .maybeSingle()
      if (project?.client_id)
        await ctx.supabase
          .from("briefs")
          .update({ client_id: project.client_id })
          .eq("id", briefId)
    }
  }
  if (projectId) await attachBriefFiles(briefId)
  return { success: true }
}

/** Offers the client hasn't answered yet, and the sets asked. */
export async function setBriefSets(
  briefId: string,
  sets: string[],
  offers: string[],
): Promise<Result> {
  const ctx = await manager()
  if (!ctx) return { success: false, error: "Cuma PM dan stakeholder." }
  const { data: brief } = await ctx.supabase
    .from("briefs")
    .select("sections, declined, accepted")
    .eq("id", briefId)
    .maybeSingle()
  if (!brief) return { success: false, error: "Brief nggak ketemu." }
  const asked = onlySets(sets)
  const offered = onlySets(offers).filter((s) => !asked.includes(s))
  if (!asked.length)
    return { success: false, error: "Minimal satu set pertanyaan." }
  // A set added later brings its questions (the edited ones stay).
  const sections = brief.sections as { set: string }[]
  const have = new Set(sections.map((s) => s.set))
  const added = baseSections([...asked, ...offered]).filter(
    (s) => s.set !== "common" && !have.has(s.set),
  )
  const next = [...sections]
  // Before the common closing sections (timeline, files).
  const tail = next.findIndex(
    (s, i) =>
      s.set === "common" &&
      i > 0 &&
      next.slice(i).every((x) => x.set === "common"),
  )
  next.splice(tail < 0 ? next.length : tail, 0, ...added)
  const { error } = await ctx.supabase
    .from("briefs")
    .update({
      sets: asked,
      offers: offered,
      // What the client took or turned down, as far as it still applies.
      accepted: ((brief.accepted ?? []) as BriefSet[]).filter((s) =>
        asked.includes(s),
      ),
      declined: ((brief.declined ?? []) as BriefSet[]).filter(
        (s) => !asked.includes(s) && !offered.includes(s),
      ),
      sections: next as never,
    })
    .eq("id", briefId)
  if (error) return { success: false, error: "Gagal menyimpan." }
  return { success: true }
}

/**
 * Deletes a brief and the uploads only it had (ones already in a project's
 * library stay there).
 */
export async function removeBrief(briefId: string): Promise<Result> {
  const ctx = await manager()
  if (!ctx) return { success: false, error: "Cuma PM dan stakeholder." }
  const { data: files } = await ctx.supabase
    .from("brief_files")
    .select("file_path, project_file_id")
    .eq("brief_id", briefId)
  const { error } = await ctx.supabase.from("briefs").delete().eq("id", briefId)
  if (error) return { success: false, error: "Gagal menghapus brief." }
  type Row = { file_path: string; project_file_id: string | null }
  const loose = ((files ?? []) as Row[])
    .filter((f) => !f.project_file_id)
    .map((f) => f.file_path)
  if (loose.length)
    await createAdminClient().storage.from(BRIEF_BUCKET).remove(loose)
  return { success: true }
}
