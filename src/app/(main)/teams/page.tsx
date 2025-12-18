import { TeamsClientPage } from "@/app/(main)/teams/ClientPage"
import { createClient } from "@/lib/supabase/server"

export default async function TeamsPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const supabase = createClient()

    const page = Number(searchParams.page) || 1
    const pageSize = 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // 🚀 PARALLEL FETCH: Count + Data at the same time
    const [countResult, dataResult] = await Promise.all([
        supabase
            .from("profiles")
            .select("*", { count: "exact", head: true }),
        supabase
            .from("profiles")
            .select("*")
            .order("full_name", { ascending: true })
            .range(from, to)
    ])

    if (dataResult.error) {
        console.error("Error fetching profiles:", dataResult.error)
        return <div>Error loading team members</div>
    }

    return (
        <TeamsClientPage
            initialData={dataResult.data || []}
            page={page}
            pageSize={pageSize}
            totalCount={countResult.count || 0}
        />
    )
}