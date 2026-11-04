import { createClient } from "@/shared/api/supabase/server"
import { accessLevel, canOpenProjectSection } from "@/shared/config/access"
import { effectiveUserIdFast } from "@/shared/lib/viewer-context-server"
import { notFound, redirect } from "next/navigation"
import { projectPath } from "./ref"

/**
 * Who may open a project (shared/config/access.ts, layer 2): stakeholders
 * open every project, everyone else only the ones they're a member of.
 * Sections they can't open (settings; invoices unless PM) send them to
 * the project's dashboard. `project` is the row resolveProjectRef found
 * (read with the viewer's own session), so it isn't fetched again.
 */
export async function assertProjectAccess(
  project: { id: string; name: string },
  section = "",
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  // Who they are comes from middleware; their role and membership are
  // read fresh, together.
  const viewerId = await effectiveUserIdFast(supabase, user.id, user.email)

  const [{ data: viewer }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, job_title")
      .eq("id", viewerId)
      .maybeSingle(),
    supabase
      .from("project_assignments")
      .select("id, is_lead")
      .eq("project_id", project.id)
      .eq("user_id", viewerId)
      .maybeSingle(),
  ])

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
