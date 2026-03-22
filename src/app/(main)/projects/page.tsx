import { ProjectsListPage } from "@/page-slices/projects"
import { createClient } from "@/shared/api/supabase/server"

export const dynamic = "force-dynamic"

export default async function ProjectsRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>Please login</div>

  return <ProjectsListPage />
}
