import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { accessLevel, canManageProject } from "@/shared/config/access"
import { cache } from "react"

type Db = Awaited<ReturnType<typeof createClient>>

export type AdminContext = { supabase: Db; userId: string }

/**
 * The effective (impersonation-aware) user when they may manage the office
 * (stakeholder), else null. Server-only. Deduped per request (React `cache`)
 * on top of the cached client, `auth.getUser()` and `resolveEffectiveUserId`,
 * so callers can run it in parallel with `getT(...)` freely.
 */
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
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
})

export type ProjectManagerContext = AdminContext & {
  level: "pm" | "stakeholder"
}

/**
 * The effective user when they manage this project (phases, team, process,
 * client, client portal, invoices, deleting it): a stakeholder, or a PM on
 * its team. Else null. Mirrors
 * is_project_pm / is_stakeholder in the DB, which enforce the same.
 */
export const getProjectManagerContext = cache(
  async (projectId: string): Promise<ProjectManagerContext | null> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const id = await resolveEffectiveUserId(supabase, user.id, user.email)
    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase
        .from("profiles")
        .select("role, job_title")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("project_assignments")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", id)
        .maybeSingle(),
    ])
    const level = accessLevel(profile)
    if (!canManageProject(level, Boolean(membership))) return null
    return { supabase, userId: id, level: level as "pm" | "stakeholder" }
  },
)

/**
 * The effective user when they are a PM or a stakeholder (access.ts PM_UP):
 * clients, process templates, payment methods. Else null. The DB agrees
 * (is_pm / is_stakeholder, migrations/pm_project_management_2.sql).
 */
export const getPmContext = cache(
  async (): Promise<ProjectManagerContext | null> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const id = await resolveEffectiveUserId(supabase, user.id, user.email)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, job_title")
      .eq("id", id)
      .maybeSingle()
    const level = accessLevel(profile)
    if (level === "employee") return null
    return { supabase, userId: id, level }
  },
)
