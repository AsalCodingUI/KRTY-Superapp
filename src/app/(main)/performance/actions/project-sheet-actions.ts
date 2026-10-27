"use server"

import { isUuid, whereRef } from "@/shared/lib/url-params"
import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import {
  getProjectScoring,
  type ProjectScoring,
} from "./project-scoring-actions"

export type ProjectSheetData = {
  assignmentId: string
  projectId: string
  employeeName: string
  projectName: string
  roleInProject: string
  scoring: ProjectScoring
  canEdit: boolean
  isStakeholder: boolean
}

/**
 * One member's scores on one project, for the side sheet. Same access as
 * the project scoring page: stakeholders and the project's lead (for
 * others) can edit; the member sees their own read-only; anyone else gets
 * nothing.
 */
export async function getProjectSheet(
  /** Ids or link keys (`?member=rizal-4526a930&project=milxa-7b583164`). */
  employeeRef: string,
  projectRef: string,
): Promise<
  { ok: true; data: ProjectSheetData } | { ok: false; error: string }
> {
  const [supabase, t] = await Promise.all([createClient(), getT("performance")])
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: t("errNoKpiAccess") }

  const idOf = async (table: "profiles" | "projects", ref: string) => {
    if (isUuid(ref)) return ref
    const query = whereRef(supabase.from(table).select("id"), ref)
    const { data } = query ? await query.maybeSingle() : { data: null }
    return (data as { id: string } | null)?.id ?? null
  }
  const [employeeId, projectId] = await Promise.all([
    idOf("profiles", employeeRef),
    idOf("projects", projectRef),
  ])
  if (!employeeId || !projectId)
    return { ok: false, error: t("errNoKpiAccess") }

  const viewerId = await resolveEffectiveUserId(supabase, user.id, user.email)
  const [{ data: viewer }, { data: assignment }, { data: leadRow }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", viewerId).maybeSingle(),
      supabase
        .from("project_assignments")
        .select(
          "id, role_in_project, profiles!project_assignments_user_id_fkey ( full_name ), projects!inner ( id, name )",
        )
        .eq("user_id", employeeId)
        .eq("project_id", projectId)
        .maybeSingle(),
      supabase
        .from("project_assignments")
        .select("id")
        .eq("user_id", viewerId)
        .eq("project_id", projectId)
        .eq("is_lead", true)
        .maybeSingle(),
    ])
  if (!assignment) return { ok: false, error: t("errNoKpiAccess") }

  const isStakeholder = canManageByRole(viewer?.role)
  const isSelf = viewerId === employeeId
  const canEdit = isStakeholder || (Boolean(leadRow) && !isSelf)
  if (!canEdit && !isSelf) return { ok: false, error: t("errNoKpiAccess") }

  const scoring = await getProjectScoring(assignment.id)
  const employeeName =
    (assignment.profiles as unknown as { full_name: string | null } | null)
      ?.full_name ?? t("member")
  const project = assignment.projects as unknown as { name: string }

  return {
    ok: true,
    data: {
      assignmentId: assignment.id,
      projectId,
      employeeName,
      projectName: scoring.project?.name ?? project.name,
      roleInProject: assignment.role_in_project,
      scoring,
      canEdit,
      isStakeholder,
    },
  }
}
