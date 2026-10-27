"use client"

import { matchProjectPath } from "@/shared/config/project-sections"
import { useProjectSummary } from "@/shared/hooks/useProjectSummary"
import { projectHref } from "@/shared/lib/url-params"
import { usePathname } from "next/navigation"

/**
 * A link to one of a project's pages when only its id is at hand: the
 * readable key from the current URL (inside that project) or from its name.
 */
export function useProjectHref(projectId: string, section = "") {
  const pathname = usePathname()
  const here = matchProjectPath(pathname)
  const { data: project } = useProjectSummary(projectId)
  if (project) return projectHref(project, section)
  if (here && here.ref.endsWith(projectId.slice(0, 8)))
    return `/projects/${here.ref}${section ? `/${section}` : ""}`
  return projectHref({ id: projectId }, section)
}
