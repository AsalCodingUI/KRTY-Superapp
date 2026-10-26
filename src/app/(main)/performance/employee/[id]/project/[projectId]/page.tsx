import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * Old link to one member's scores on one project. The scores now open in
 * the side sheet (`?project=`) over the list they belong to, so this only
 * sends old links (notifications, bookmarks) there; the sheet does the
 * access checks.
 */
export default async function ProjectScoringRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; projectId: string }>
  searchParams: Promise<{ period?: string; from?: string }>
}) {
  const { id: employeeId, projectId } = await params
  const { period, from } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const viewerId = await resolveEffectiveUserId(supabase, user.id, user.email)
  const { data: viewer } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", viewerId)
    .maybeSingle()

  const query = new URLSearchParams()
  if (period) query.set("period", period)
  query.set("project", projectId)

  // Your own project: "KPI saya". A stakeholder: that member's KPI page.
  // A lead: the project's "Penilaian" page, naming the member.
  if (viewerId === employeeId) redirect(`/performance?${query}`)
  if (canManageByRole(viewer?.role) && from !== "team" && from !== "tim")
    redirect(`/performance/employee/${employeeId}?${query}`)
  query.delete("period")
  query.set("member", employeeId)
  redirect(`/projects/${projectId}/assessment?${query}`)
}
