import { ProjectWorkspacePage } from "@/page-slices/projects/ui/workspace/ProjectWorkspacePage"
import { notFound, redirect } from "next/navigation"
import { assertProjectAccess } from "../access"
import { resolveProjectRef } from "../ref"

export const dynamic = "force-dynamic"

const SECTIONS = [
  "tasks",
  "reports",
  "invoices",
  "documents",
  "library",
  "assessment",
  "settings",
] as const
type Section = (typeof SECTIONS)[number]

export default async function ProjectSectionRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; tab: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ id: ref, tab }, search] = await Promise.all([params, searchParams])
  // Old tabs: Finance became Invoice; Overview/Calculations/SLAs are gone.
  if (tab === "finance") redirect(`/projects/${ref}/invoices`)
  if (["overview", "calculations", "slas"].includes(tab))
    redirect(`/projects/${ref}`)
  if (!SECTIONS.includes(tab as Section)) notFound()
  const { id } = await resolveProjectRef(ref, tab, search)
  await assertProjectAccess(id, tab)
  return <ProjectWorkspacePage projectId={id} section={tab as Section} />
}
