import { ProjectSLAEditPage } from "@/page-slices/projects/ui/ProjectSLAEditPage"
import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface ProjectSLAEditRouteProps {
  params: Promise<{
    id: string
    slaId: string
  }>
}

export default async function ProjectSLAEditRoute({
  params,
}: ProjectSLAEditRouteProps) {
  const { id, slaId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user == null) return <div>{(await getT("projects"))("pleaseLogin")}</div>

  const { data: sla } = await supabase
    .from("slas")
    .select("*")
    .eq("id", slaId)
    .maybeSingle()

  if (!sla) {
    notFound()
  }

  return <ProjectSLAEditPage projectId={id} slaId={slaId} sla={sla} />
}
