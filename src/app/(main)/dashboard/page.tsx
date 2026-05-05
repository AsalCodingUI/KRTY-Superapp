import { createClient } from "@/shared/api/supabase/server"
import { resolveEffectiveUserId } from "@/shared/lib/impersonation-server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { getCurrentUserSafely } from "@/shared/lib/supabase-auth"

export const dynamic = "force-dynamic"
import { canManageByRole } from "@/shared/lib/roles"
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
  try {
    const resolvedSearchParams = await searchParams
    const supabase = await createClient()

    const { user, error: authError } = await getCurrentUserSafely(
      supabase,
      "dashboard-page",
    )

    if (authError && !user) {
      return (
        <div className="py-12 text-center">
          <p className="text-foreground-secondary">{authError}</p>
        </div>
      )
    }

    if (!user) redirect("/login")

    const effectiveUserId = await resolveEffectiveUserId(
      supabase,
      user.id,
      user.email,
    )

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
          <p className="text-foreground-secondary">Profile not found</p>
        </div>
      )
    }

    const isAdminOrStakeholder = canManageByRole(profile.role)

    if (isAdminOrStakeholder) {
      const result = await getAdminDashboardData()

      if (!result.success || !result.data) {
        return (
          <div className="py-12 text-center">
            <p className="text-foreground-secondary">
              {result.error || "Failed to load dashboard data"}
            </p>
          </div>
        )
      }

      return <AdminDashboard data={result.data} />
    }

    const quarterParam =
      typeof resolvedSearchParams.quarter === "string"
        ? resolvedSearchParams.quarter
        : undefined
    const result = await getEmployeeDashboardData(effectiveUserId, quarterParam)

    if (!result.success || !result.data) {
      return (
        <div className="py-12 text-center">
          <p className="text-foreground-secondary">
            {result.error || "Failed to load dashboard data"}
          </p>
        </div>
      )
    }

    return <EmployeeDashboard data={result.data} initialQuarter={quarterParam} />
  } catch {
    return (
      <div className="py-12 text-center">
        <p className="text-foreground-secondary">
          Failed to load dashboard data
        </p>
      </div>
    )
  }
}
