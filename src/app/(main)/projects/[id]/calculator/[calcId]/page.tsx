import { ProjectCalculatorEditPage } from "@/page-slices/projects/ui/ProjectCalculatorEditPage"
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

  // Every read is independent (the project id comes from the route), so run
  // them together instead of one after another.
  const [
    {
      data: { user },
    },
    { data: calculation },
    { data: project },
    { data: teamMembers },
    { data: operationalCosts },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("project_calculations")
      .select("*")
      .eq("id", calcId)
      .maybeSingle(),
    supabase.from("projects").select("id, name").eq("id", id).maybeSingle(),
    supabase.rpc("get_team_compensation"),
    supabase.from("operational_costs").select("*"),
  ])

  if (user == null) return <div>Please login</div>

  if (!calculation || !project || calculation.project_id !== project.id) {
    notFound()
  }

  return (
    <ProjectCalculatorEditPage
      projectId={id}
      calcId={calcId}
      project={project}
      teamMembers={(teamMembers || []).filter(
        (p: { role: string }) => p.role === "employee",
      )}
      operationalCosts={operationalCosts || []}
      calculation={calculation}
    />
  )
}
