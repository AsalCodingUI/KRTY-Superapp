import { ProjectsListPage } from "@/page-slices/projects/ui/ProjectsListPage"
import { createClient } from "@/shared/api/supabase/server"
import { getT } from "@/shared/i18n/server"

export const dynamic = "force-dynamic"

export default async function ProjectsRoute() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <div>{(await getT("projects"))("pleaseLogin")}</div>

  return <ProjectsListPage />
}
