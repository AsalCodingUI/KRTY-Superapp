import { TeamsPage } from "@/page-slices/teams"
import { createClient } from "@/shared/api/supabase/server"

export default async function TeamsRoute({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const page = Number(searchParams.page) || 1
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // 🚀 PARALLEL FETCH: Count + Data at the same time
  const [countResult, dataResult, roleResult] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true })
      .range(from, to),
    user
      ? supabase.from("profiles").select("role").eq("id", user.id).single()
      : Promise.resolve(null),
  ])

  if (dataResult.error) {
    console.error("Error fetching profiles:", dataResult.error)
    return <div>Error loading team members</div>
  }

  const role = roleResult?.data?.role ?? "employee"

  return (
    <TeamsPage
      initialData={dataResult.data || []}
      page={page}
      pageSize={pageSize}
      totalCount={countResult.count || 0}
      role={role}
    />
  )
}
