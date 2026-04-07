import { TeamsPage } from "@/page-slices/teams"
import { createClient } from "@/shared/api/supabase/server"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { resolveProfileByUserIdOrEmail } from "@/shared/lib/profile-resolution"

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

  const [dataResult, roleResult] = await Promise.all([
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
  ])

  if (dataResult.error) {
    console.error("Error fetching profiles:", dataResult.error)
    return <div>Error loading team members</div>
  }

  const role = roleResult?.role ?? "employee"
  const dedupedProfiles = dedupeProfilesByEmail(
    dataResult.data || [],
  ) as typeof dataResult.data

  return (
    <TeamsPage
      initialData={dedupedProfiles}
      page={page}
      pageSize={pageSize}
      totalCount={dedupedProfiles.length}
      role={role}
    />
  )
}
