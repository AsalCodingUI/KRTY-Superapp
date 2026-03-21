import { PermissionSettingsPage } from "@/page-slices/settings"
import { createClient } from "@/shared/api/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function PermissionRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!currentProfile?.is_super_admin) {
    redirect("/dashboard")
  }

  const [{ data: profiles, error: profilesError }, { data: permissions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, job_title, is_super_admin, avatar_url, hourly_rate, krt_id, leave_balance, leave_used, manager_id, team_id, created_at, updated_at",
        )
        .order("full_name", { ascending: true }),
      supabase
        .from("user_page_permissions")
        .select("id, user_id, page_slug, granted, granted_by, created_at"),
    ])

  if (profilesError) {
    return (
      <div className="p-4 text-red-500">Error loading permissions data.</div>
    )
  }

  return (
    <PermissionSettingsPage
      initialData={profiles || []}
      initialPermissions={permissions || []}
    />
  )
}
