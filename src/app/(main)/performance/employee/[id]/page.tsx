import { EmployeeKpiPage } from "@/page-slices/performance/ui/kpi/EmployeeKpiPage"
import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { canManageByRole } from "@/shared/lib/roles"
import { employeeHref, whereRef } from "@/shared/lib/url-params"
import { notFound, redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function EmployeeKpiRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // `rizal-dwi-artanto-4526a930`, or a full id from an older link.
  const [{ id: ref }, search] = await Promise.all([params, searchParams])
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // The employee row doesn't depend on the viewer: fetch both together.
  const [viewerId, { data: employee }] = await Promise.all([
    resolveEffectiveUserId(supabase, user.id, user.email),
    whereRef(
      supabase.from("profiles").select("id, full_name, avatar_url, job_title"),
      ref,
    )?.maybeSingle() ?? Promise.resolve({ data: null }),
  ])
  const id = employee?.id
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
  const canonical = employeeHref(employee)
  if (!canonical.endsWith(`/${ref}`)) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(search))
      for (const v of [value].flat()) if (v !== undefined) query.append(key, v)
    redirect(query.size ? `${canonical}?${query}` : canonical)
  }

  return <EmployeeKpiPage employee={employee} />
}
