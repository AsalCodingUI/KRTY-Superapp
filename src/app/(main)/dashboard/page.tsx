import { createClient } from "@/shared/api/supabase/server"
import { redirect } from "next/navigation"
import { getAdminDashboardData } from "./actions/dashboard-admin-actions"
import { getEmployeeDashboardData } from "./actions/dashboard-employee-actions"
import { AdminDashboard } from "./components/AdminDashboard"
import { EmployeeDashboard } from "./components/EmployeeDashboard"
import { canManageByRole } from "@/shared/lib/roles"

export default async function DashboardRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return (
      <div className="py-12 text-center">
        <p className="text-foreground-secondary">Profile not found</p>
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
          <p className="text-foreground-secondary">
            {result.error || "Failed to load dashboard data"}
          </p>
        </div>
      )
    }

    return <AdminDashboard data={result.data} />
  } else {
    // Employee Dashboard
    const result = await getEmployeeDashboardData()

    if (!result.success || !result.data) {
      return (
        <div className="py-12 text-center">
          <p className="text-foreground-secondary">
            {result.error || "Failed to load dashboard data"}
          </p>
        </div>
      )
    }

    return <EmployeeDashboard data={result.data} />
  }
}
