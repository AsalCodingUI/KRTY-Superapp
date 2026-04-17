import { TeamsPage } from "@/page-slices/teams"
import { createClient } from "@/shared/api/supabase/server"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"
import { logError } from "@/shared/lib/utils/logger"

export const dynamic = "force-dynamic"

export default async function TeamsRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const page = Number(resolvedSearchParams.page) || 1
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const [dataResult, roleResult, statsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, job_title, role, hourly_rate")
      .order("full_name", { ascending: true })
      .range(from, to),
    user
      ? resolveProfileByUserIdOrEmail<{
          id: string
          email: string | null
          role: string | null
        }>(supabase, "id, email, role, created_at", user.id, user.email)
      : Promise.resolve(null),
    supabase.from("profiles").select("job_title, role"),
  ])

  if (dataResult.error) {
    logError("Error fetching profiles:", dataResult.error)
    return <div>Error loading team members</div>
  }

  const role = roleResult?.role ?? "employee"
  const dedupedProfiles = dedupeProfilesByEmail(
    dataResult.data || [],
  ) as typeof dataResult.data

  const allProfiles: Array<{ job_title: string | null; role: string | null }> =
    statsResult.data ?? []
  const teamStats = {
    total: allProfiles.length,
    designers: allProfiles.filter((p) => p.job_title === "Designer").length,
    developers: allProfiles.filter((p) => p.job_title === "Web Developer").length,
    pms: allProfiles.filter((p) => p.job_title === "Project Manager").length,
    admins: allProfiles.filter(
      (p) => p.role === "stakeholder" || p.job_title === "Admin",
    ).length,
  }

  return (
    <TeamsPage
      initialData={dedupedProfiles}
      page={page}
      pageSize={pageSize}
      totalCount={allProfiles.length}
      role={role}
      teamStats={teamStats}
    />
  )
}
