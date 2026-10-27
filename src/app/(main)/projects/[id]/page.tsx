import { ProjectWorkspacePage } from "@/page-slices/projects/ui/workspace/ProjectWorkspacePage"
import { assertProjectAccess } from "./access"
import { resolveProjectRef } from "./ref"

export const dynamic = "force-dynamic"

export default async function ProjectRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ id: ref }, search] = await Promise.all([params, searchParams])
  const { id } = await resolveProjectRef(ref, "", search)
  await assertProjectAccess(id)
  return <ProjectWorkspacePage projectId={id} section="" />
}
