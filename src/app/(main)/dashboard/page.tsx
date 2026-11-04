import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"

export const dynamic = "force-dynamic"
import { canManageByRole } from "@/shared/lib/roles"
import { getT } from "@/shared/i18n/server"
import { redirect } from "next/navigation"
import { getAdminDashboardData } from "./actions/dashboard-admin-actions"
import {
  getEmployeeDashboardData,
  type EmployeeDashboardViewer,
} from "./actions/dashboard-employee-actions"
import { AdminDashboard } from "./components/AdminDashboard"
import { EmployeeDashboard } from "./components/EmployeeDashboard"

export default async function DashboardRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const [resolvedSearchParams, t, { data }] = await Promise.all([
    searchParams,
    getT("dashboard"),
    supabase.auth.getUser(),
  ])
  const user = data.user
  if (!user) redirect("/login")

  const effectiveUserId = await resolveEffectiveUserId(
    supabase,
    user.id,
    user.email,
  )

  // One lookup with every column either dashboard needs (role to route, the
  // rest for the employee view), passed down instead of looked up again.
  const profile = await resolveProfileByUserIdOrEmail<
    EmployeeDashboardViewer & { role: string | null }
  >(
    supabase,
    "id, email, full_name, role, job_title, avatar_url, join_date, employment_type, created_at",
    effectiveUserId,
    user.email,
  )

  if (!profile) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{t("profileNotFound")}</p>
      </div>
    )
  }

  const isAdminOrStakeholder = canManageByRole(profile.role)

  // Route to appropriate dashboard based on role
  if (isAdminOrStakeholder) {
    // Admin/Stakeholder Dashboard
    const result = await getAdminDashboardData(profile)

    if (!result.success || !result.data) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {result.error || t("loadFailed")}
          </p>
        </div>
      )
    }

    return <AdminDashboard data={result.data} />
  } else {
    // Employee Dashboard
    const quarterParam =
      typeof resolvedSearchParams.period === "string"
        ? resolvedSearchParams.period
        : undefined
    const result = await getEmployeeDashboardData(
      effectiveUserId,
      profile,
      quarterParam,
    )

    if (!result.success || !result.data) {
      return (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {result.error || t("loadFailed")}
          </p>
        </div>
      )
    }

    return (
      <EmployeeDashboard data={result.data} initialQuarter={quarterParam} />
    )
  }
}
