"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

/** Content-area placeholder while a section's chunk loads (matches loading.tsx). */
function SectionFallback() {
  return (
    <div className="space-y-4 pt-6 pb-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

// Only one section renders per route, so each loads as its own chunk.
const loading = () => <SectionFallback />
const PAGES = {
  "": dynamic(
    () => import("./ProjectDashboard").then((m) => m.ProjectDashboard),
    { loading },
  ),
  tasks: dynamic(() => import("./ProjectTasks").then((m) => m.ProjectTasks), {
    loading,
  }),
  invoices: dynamic(
    () => import("./ProjectInvoices").then((m) => m.ProjectInvoices),
    { loading },
  ),
  documents: dynamic(
    () => import("./ProjectDocuments").then((m) => m.ProjectDocuments),
    { loading },
  ),
  library: dynamic(
    () => import("./ProjectLibrary").then((m) => m.ProjectLibrary),
    { loading },
  ),
  settings: dynamic(
    () => import("./ProjectSettings").then((m) => m.ProjectSettings),
    { loading },
  ),
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
