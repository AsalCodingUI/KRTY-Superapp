import { createClient } from "@/shared/api/supabase/server"
import SLAContainer from "./components/SLAContainer"
import SLADashboard from "./components/SLADashboard"

export default async function SLAPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()
  const mode = resolvedSearchParams.mode as string | undefined
  const id = resolvedSearchParams.id as string | undefined

  if (mode === "edit" || mode === "create") {
    let initialData: any = undefined

    if (mode === "edit" && id) {
      const { data } = await supabase
        .from("slas")
        .select("client_info,agency_info,scope_of_work,milestones")
        .eq("id", id)
        .single()

      if (data) {
        initialData = {
          client_info: data.client_info,
          agency_info: data.agency_info,
          scope_of_work: data.scope_of_work,
          milestones: data.milestones,
        }
      }
    }

    return <SLAContainer slaId={id} initialData={initialData} />
  }

  const { data } = await supabase
    .from("slas")
    .select("id,client_name,project_name,created_at,archived_at")
    .order("created_at", { ascending: false })

  const slas =
    data?.map((row: { id: string; client_name: string; project_name: string; created_at: string; archived_at: string | null }) => ({
      id: row.id,
      client_name: row.client_name,
      title: row.project_name,
      status: row.archived_at ? "Archived" : "Active",
      created_at: row.created_at,
      archived_at: row.archived_at,
    })) || []

  return <SLADashboard slas={slas} />
}
