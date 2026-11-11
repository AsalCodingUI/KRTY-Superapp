"use client"

import { ProjectAvatar } from "@/components/project-avatar"
import { createClient } from "@/shared/api/supabase/client"
import { accessLevel, canOpenProjectSection } from "@/shared/config/access"
import {
  matchProjectPath,
  PROJECT_SECTIONS,
} from "@/shared/config/project-sections"
import { useProjectSummary } from "@/shared/hooks/useProjectSummary"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { isAdminRole } from "@/shared/lib/roles"
import { projectHref } from "@/shared/lib/url-params"
import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import * as React from "react"
import type { NavMainItem } from "@/components/nav-main"

/** "nav" message key for each project page, by slug (see PROJECT_SECTIONS). */
export const PROJECT_SECTION_KEYS: Record<string, MessageKey<"nav">> = {
  "": "projectDashboard",
  tasks: "projectTasks",
  reports: "projectReports",
  invoices: "projectInvoices",
  documents: "projectDocuments",
  library: "projectLibrary",
  assessment: "projectAssessment",
  settings: "projectSettings",
}

type SidebarProject = { id: string; name: string; href: string }

/** Projects under way: not-started ones wait on the Projects page. */
const SIDEBAR_STATUSES = ["Active", "Review"]

/**
 * Projects in the sidebar: every active one for stakeholders, the viewer's
 * own assignments for everyone else.
 */
function useSidebarProjects(profile: { id: string; role: string } | null) {
  return useQuery<SidebarProject[]>({
    queryKey: ["sidebar-projects", profile?.id, profile?.role],
    enabled: Boolean(profile),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!profile) return []
      const supabase = createClient()
      if (isAdminRole(profile.role)) {
        const { data } = await supabase
          .from("projects")
          .select("id, name")
          .in("status", SIDEBAR_STATUSES)
          .order("name")
        return ((data ?? []) as { id: string; name: string }[]).map((p) => ({
          ...p,
          href: projectHref(p),
        }))
      }
      const { data } = await supabase
        .from("project_assignments")
        .select("projects!inner(id, name, status)")
        .eq("user_id", profile.id)
        .in("projects.status", SIDEBAR_STATUSES)
      type Row = { projects: { id: string; name: string } }
      return ((data ?? []) as unknown as Row[])
        .map((row) => row.projects)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((p) => ({ id: p.id, name: p.name, href: projectHref(p) }))
    },
  })
}

/**
 * The projects as rows of the Project section, each opening in place to
 * its pages (Dashboard, Tugas, Report …), Linear-style: the one you're in
 * opens by itself, the others on their chevron. The open project is listed
 * even when it isn't under way (a stakeholder opening an old one).
 */
export function useProjectTree(): NavMainItem[] {
  const t = useT("nav")
  const pathname = usePathname()
  const { profile } = useUserProfile()
  const { data: projects = [] } = useSidebarProjects(
    profile ? { id: profile.id, role: profile.role } : null,
  )
  const match = matchProjectPath(pathname)
  const { data: current } = useProjectSummary(match?.ref)
  // Whether the viewer leads the open project: its "Penilaian" is theirs.
  const { data: isLead = false } = useQuery({
    queryKey: ["project-is-lead", current?.id, profile?.id],
    enabled: Boolean(current?.id && profile?.id),
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await createClient()
        .from("project_assignments")
        .select("is_lead")
        .eq("project_id", current!.id)
        .eq("user_id", profile!.id)
        .maybeSingle()
      return Boolean(data?.is_lead)
    },
  })

  return React.useMemo(() => {
    const level = accessLevel(profile)
    const base = match ? `/projects/${match.ref}` : null
    const list = [...projects]
    if (base && current && !list.some((p) => p.href === base))
      list.unshift({ id: current.id, name: current.name, href: base })
    return list.map((project) => {
      const here = project.href === base
      const sections = PROJECT_SECTIONS.filter(
        (s) =>
          canOpenProjectSection(s.slug, level) &&
          (s.slug !== "assessment" ||
            level === "stakeholder" ||
            (here && isLead)),
      )
      return {
        title: project.name,
        url: project.href,
        icon: (
          <ProjectAvatar
            id={project.id}
            name={project.name}
            className="size-3.5"
          />
        ),
        isActive: here,
        items: sections.map((s) => ({
          title: PROJECT_SECTION_KEYS[s.slug]
            ? t(PROJECT_SECTION_KEYS[s.slug])
            : s.name,
          url: s.slug ? `${project.href}/${s.slug}` : project.href,
          isActive: here && match?.slug === s.slug,
        })),
      }
    })
  }, [projects, current, match, profile, isLead, t])
}
