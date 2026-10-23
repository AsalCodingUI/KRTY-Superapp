import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"

export const dynamic = "force-dynamic"
import { canManageByRole } from "@/shared/lib/roles"
import { getT } from "@/shared/i18n/server"
import { redirect } from "next/navigation"
import { getAdminDashboardData } from "./actions/dashboard-admin-actions"
import { getEmployeeDashboardData } from "./actions/dashboard-employee-actions"
import { AdminDashboard } from "./components/AdminDashboard"
import { EmployeeDashboard } from "./components/EmployeeDashboard"

export default async function DashboardRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const t = await getT("dashboard")
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const effectiveUserId = await resolveEffectiveUserId(
    supabase,
    user.id,
    user.email,
  )

  // Get user profile to determine role
  const profile = await resolveProfileByUserIdOrEmail<{
    id: string
    email: string | null
    full_name: string | null
    role: string | null
  }>(
    supabase,
    "id, email, full_name, role, created_at",
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
    const result = await getAdminDashboardData()

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
      typeof resolvedSearchParams.quarter === "string"
        ? resolvedSearchParams.quarter
        : undefined
    const result = await getEmployeeDashboardData(effectiveUserId, quarterParam)

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
