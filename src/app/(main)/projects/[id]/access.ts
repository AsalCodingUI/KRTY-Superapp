import { createClient } from "@/shared/api/supabase/server"
import { accessLevel, canOpenProjectSection } from "@/shared/config/access"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { notFound, redirect } from "next/navigation"
import { projectPath } from "./ref"

/**
 * Who may open a project (shared/config/access.ts, layer 2): stakeholders
 * open every project, everyone else only the ones they're a member of.
 * Sections they can't open (settings; invoices unless PM) send them to
 * the project's dashboard.
 */
export async function assertProjectAccess(id: string, section = "") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const viewerId = await resolveEffectiveUserId(supabase, user.id, user.email)

  const [{ data: project }, { data: viewer }, { data: membership }] =
    await Promise.all([
      supabase.from("projects").select("id, name").eq("id", id).maybeSingle(),
      supabase
        .from("profiles")
        .select("role, job_title")
        .eq("id", viewerId)
        .maybeSingle(),
      supabase
        .from("project_assignments")
        .select("id, is_lead")
        .eq("project_id", id)
        .eq("user_id", viewerId)
        .maybeSingle(),
    ])
  if (!project) notFound()

  const level = accessLevel(viewer)
  if (level !== "stakeholder" && !membership) notFound()
  if (section && !canOpenProjectSection(section, level)) {
    redirect(projectPath(project))
  }
  // "Penilaian" is the lead's (and stakeholders') page.
  if (
    section === "assessment" &&
    level !== "stakeholder" &&
    !membership?.is_lead
  ) {
    redirect(projectPath(project))
  }
}
