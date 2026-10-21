"use client"

import { ProjectDashboard } from "./ProjectDashboard"
import { ProjectDocuments } from "./ProjectDocuments"
import { ProjectInvoices } from "./ProjectInvoices"
import { ProjectLibrary } from "./ProjectLibrary"
import { ProjectSettings } from "./ProjectSettings"
import { ProjectTasks } from "./ProjectTasks"

const PAGES = {
  "": ProjectDashboard,
  tasks: ProjectTasks,
  invoices: ProjectInvoices,
  documents: ProjectDocuments,
  library: ProjectLibrary,
  settings: ProjectSettings,
} as const

export type ProjectSection = keyof typeof PAGES

export const PROJECT_SECTION_SLUGS = Object.keys(PAGES) as ProjectSection[]

/** One project page; the sidebar (NavProject) switches between them. */
export function ProjectWorkspacePage({
  projectId,
  section,
}: {
  projectId: string
  section: ProjectSection
}) {
  const Page = PAGES[section]
  return <Page projectId={projectId} />
}
