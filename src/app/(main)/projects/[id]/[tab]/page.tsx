import { ProjectWorkspacePage } from "@/page-slices/projects/ui/workspace/ProjectWorkspacePage"
import { notFound, redirect } from "next/navigation"
import { assertProjectAccess } from "../access"

export const dynamic = "force-dynamic"

const SECTIONS = [
  "tasks",
  "invoices",
  "documents",
  "library",
  "settings",
] as const
type Section = (typeof SECTIONS)[number]

export default async function ProjectSectionRoute({
  params,
}: {
  params: Promise<{ id: string; tab: string }>
}) {
  const { id, tab } = await params
  // Old tabs: Finance became Invoice; Overview/Calculations/SLAs are gone.
  if (tab === "finance") redirect(`/projects/${id}/invoices`)
  if (["overview", "calculations", "slas"].includes(tab))
    redirect(`/projects/${id}`)
  if (!SECTIONS.includes(tab as Section)) notFound()
  await assertProjectAccess(id)
  return <ProjectWorkspacePage projectId={id} section={tab as Section} />
}
