import { ProjectDetailPage } from "@/page-slices/projects"
import { createClient } from "@/shared/api/supabase/server"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface ProjectDetailRouteProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailRoute({
  params,
}: ProjectDetailRouteProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user == null) return <div>Please login</div>

  const { data: project } = await supabase
    .from("projects")
    .select(
      `
        *,
        project_assignments (
          *,
          profiles (*)
        )
      `,
    )
    .eq("id", id)
    .maybeSingle()

  if (!project) {
    notFound()
  }

  return <ProjectDetailPage project={project} />
}
