"use server"

import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { revalidatePath } from "next/cache"

/** Clients are stakeholder-only; RLS enforces the same. */

type Result<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

export type ClientInput = {
  name: string
  contactName: string
  email: string
  phone: string
  website: string
  country: string
  address: string
  currency: string
  notes: string
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function saveClient(
  id: string | null,
  input: ClientInput,
): Promise<Result<{ id: string }>> {
  const t = await getT("clients")
  const ctx = await admin()
  if (!ctx) return { success: false, error: t("errNotAllowed") }

  const name = input.name.trim()
  if (!name) return { success: false, error: t("errNameRequired") }
  if (name.length > 120) return { success: false, error: t("errNameTooLong") }
  if (input.email.trim() && !EMAIL.test(input.email.trim()))
    return { success: false, error: t("errEmail") }
  if (!/^[A-Z]{3}$/.test(input.currency))
    return { success: false, error: t("errCurrency") }
  if (input.notes.length > 2000)
    return { success: false, error: t("errNotesTooLong") }

  const row = {
    name,
    contact_name: input.contactName.trim() || null,
    email: input.email.trim() || null,
    phone: input.phone.trim() || null,
    website: input.website.trim() || null,
    country: input.country.trim() || null,
    address: input.address.trim().slice(0, 500) || null,
    currency: input.currency,
    notes: input.notes.trim() || null,
  }
  const { data, error } = id
    ? await ctx.supabase
        .from("clients")
        .update(row)
        .eq("id", id)
        .select("id")
        .single()
    : await ctx.supabase
        .from("clients")
        .insert({ ...row, created_by: ctx.userId })
        .select("id")
        .single()
  if (error || !data)
    return {
      success: false,
      error: error?.code === "23505" ? t("errDuplicate") : t("errSave"),
    }
  revalidatePath("/clients")
  revalidatePath("/projects")
  return { success: true, data: { id: data.id } }
}

export async function setClientArchived(
  id: string,
  archived: boolean,
): Promise<Result> {
  const t = await getT("clients")
  const ctx = await admin()
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const { error } = await ctx.supabase
    .from("clients")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
  if (error) return { success: false, error: t("errSave") }
  revalidatePath("/clients")
  return { success: true }
}

/** Projects keep their history; they only lose the link (and copied text). */
export async function deleteClient(id: string): Promise<Result> {
  const t = await getT("clients")
  const ctx = await admin()
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const { error } = await ctx.supabase.from("clients").delete().eq("id", id)
  if (error) return { success: false, error: t("errDelete") }
  revalidatePath("/clients")
  revalidatePath("/projects")
  return { success: true }
}

/** Links a project to a client (or unlinks with null). */
export async function setProjectClient(
  projectId: string,
  clientId: string | null,
): Promise<Result> {
  const t = await getT("clients")
  const ctx = await admin()
  if (!ctx) return { success: false, error: t("errNotAllowed") }
  const { error } = await ctx.supabase
    .from("projects")
    .update({ client_id: clientId })
    .eq("id", projectId)
  if (error) return { success: false, error: t("errSave") }
  revalidatePath("/clients")
  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}
