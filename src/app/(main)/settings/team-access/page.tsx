import { TeamAccessSettingsPage } from "@/page-slices/settings"
import { createClient } from "@/shared/api/supabase/server"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function TeamAccessRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const currentProfile = await resolveProfileByUserIdOrEmail<{
    id: string
    email: string | null
    is_super_admin: boolean | null
  }>(supabase, "id, email, is_super_admin, created_at", user.id, user.email)

  if (!currentProfile?.is_super_admin) {
    redirect("/dashboard")
  }

  const [{ data: profiles, error: profilesError }, { data: teams, error: teamsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, job_title, is_super_admin, avatar_url, hourly_rate, krt_id, leave_balance, leave_used, manager_id, team_id, created_at, updated_at",
        )
        .order("full_name", { ascending: true }),
      supabase.from("teams").select("id, name, code, created_at").order("name"),
    ])

  if (profilesError || teamsError) {
    return (
      <div className="p-4 text-red-500">
        Error loading team access data.
      </div>
    )
  }

  return (
    <TeamAccessSettingsPage
      initialProfiles={profiles || []}
      teams={teams || []}
    />
  )
}
