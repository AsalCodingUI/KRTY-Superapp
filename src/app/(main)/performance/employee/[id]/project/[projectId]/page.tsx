import { getProjectScoring } from "@/app/(main)/performance/actions/project-scoring-actions"
import { ProjectScoringView } from "@/page-slices/performance/ui/kpi/ProjectScoringView"
import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * One member's scores on one project. Stakeholders and the project's lead
 * (for others) can edit; the member sees their own scores read-only.
 */
export default async function ProjectScoringRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; projectId: string }>
  searchParams: Promise<{ periode?: string; dari?: string }>
}) {
  const { id: employeeId, projectId } = await params
  const { periode, dari } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const viewerId = await resolveEffectiveUserId(supabase, user.id, user.email)
  const [{ data: viewer }, { data: assignment }, { data: leadRow }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", viewerId).maybeSingle(),
      supabase
        .from("project_assignments")
        .select(
          "id, role_in_project, profiles!project_assignments_user_id_fkey ( full_name ), projects!inner ( id, name, quarter_id, status )",
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
  if (!assignment) notFound()

  const isStakeholder = canManageByRole(viewer?.role)
  const isSelf = viewerId === employeeId
  const canEdit = isStakeholder || (Boolean(leadRow) && !isSelf)
  if (!canEdit && !isSelf) notFound()

  const scoring = await getProjectScoring(
    assignment.id,
    assignment.role_in_project,
  )
  const period = periode ? `?periode=${encodeURIComponent(periode)}` : ""
  const fromTeam = dari === "tim"
  const backHref = fromTeam
    ? `/performance/team${period}`
    : isStakeholder && !isSelf
      ? `/performance/employee/${employeeId}${period}`
      : `/performance${period}`
  const employeeName =
    (assignment.profiles as unknown as { full_name: string | null } | null)
      ?.full_name ?? "Anggota"
  const project = assignment.projects as unknown as {
    name: string
    quarter_id: string | null
    status: string
  }

  return (
    <ProjectScoringView
      assignmentId={assignment.id}
      employeeName={employeeName}
      project={{
        name: project.name,
        quarter: project.quarter_id,
        status: project.status,
      }}
      roleInProject={assignment.role_in_project}
      initial={scoring}
      canEdit={canEdit}
      backHref={backHref}
      backLabel={fromTeam ? "Tim saya" : isSelf ? "KPI saya" : employeeName}
    />
  )
}
