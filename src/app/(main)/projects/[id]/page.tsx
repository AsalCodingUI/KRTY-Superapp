import { ProjectWorkspacePage } from "@/page-slices/projects/ui/workspace/ProjectWorkspacePage"
import { assertProjectAccess } from "./access"

export const dynamic = "force-dynamic"

export default async function ProjectRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await assertProjectAccess(id)
  return <ProjectWorkspacePage projectId={id} section="" />
}
