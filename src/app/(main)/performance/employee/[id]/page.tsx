import { EmployeeKpiPage } from "@/page-slices/performance/ui/kpi/EmployeeKpiPage"
import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EmployeeKpiRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // The employee row doesn't depend on the viewer: fetch both together.
  const [viewerId, { data: employee }] = await Promise.all([
    resolveEffectiveUserId(supabase, user.id, user.email),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, job_title")
      .eq("id", id)
      .maybeSingle(),
  ])
  const { data: viewer } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", viewerId)
    .maybeSingle()
  // Members see their own KPI on /performance; this page is the admin view.
  if (viewerId === id && !canManageByRole(viewer?.role))
    redirect("/performance")
  if (!canManageByRole(viewer?.role)) notFound()
  if (!employee) notFound()

  return <EmployeeKpiPage employee={employee} />
}
