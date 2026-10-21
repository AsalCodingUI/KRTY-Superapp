import { ProjectCalculatorEditPage } from "@/page-slices/projects"
import { createClient } from "@/shared/api/supabase/server"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface ProjectCalculatorEditRouteProps {
  params: Promise<{
    id: string
    calcId: string
  }>
}

export default async function ProjectCalculatorEditRoute({
  params,
}: ProjectCalculatorEditRouteProps) {
  const { id, calcId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user == null) return <div>Please login</div>

  const { data: calculation } = await supabase
    .from("project_calculations")
    .select("*")
    .eq("id", calcId)
    .maybeSingle()

  if (!calculation) {
    notFound()
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", calculation.project_id)
    .maybeSingle()

  if (!project || project.id !== id) {
    notFound()
  }

  const { data: teamMembers } = await supabase
    .rpc("get_team_compensation")

  const { data: operationalCosts } = await supabase
    .from("operational_costs")
    .select("*")

  return (
    <ProjectCalculatorEditPage
      projectId={id}
      calcId={calcId}
      project={project}
      teamMembers={(teamMembers || []).filter((p: { role: string }) => p.role === "employee")}
      operationalCosts={operationalCosts || []}
      calculation={calculation}
    />
  )
}
