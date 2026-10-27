"use client"

import { PrefetchLink } from "@/components/prefetch-link"
import { ProjectAvatar } from "@/components/project-avatar"
import { SlidingIndicator } from "@/components/sliding-indicator"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  matchProjectPath,
  PROJECT_SECTIONS,
} from "@/shared/config/project-sections"
import { accessLevel, canOpenProjectSection } from "@/shared/config/access"
import { useProjectSummary } from "@/shared/hooks/useProjectSummary"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import { RiArrowLeftLine } from "@/shared/ui/lucide-icons"
import { createClient } from "@/shared/api/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"

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

/** Sub sidebar while a project is open: back, the project, its pages. */
export function NavProject() {
  const t = useT("nav")
  const pathname = usePathname()
  const match = matchProjectPath(pathname)
  const { data: project } = useProjectSummary(match?.ref)
  const { profile } = useUserProfile()
  // Whether the viewer leads this project: "Penilaian" is theirs.
  const { data: isLead = false } = useQuery({
    queryKey: ["project-is-lead", project?.id, profile?.id],
    enabled: Boolean(project?.id && profile?.id),
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await createClient()
        .from("project_assignments")
        .select("is_lead")
        .eq("project_id", project!.id)
        .eq("user_id", profile!.id)
        .maybeSingle()
      return Boolean(data?.is_lead)
    },
  })
  if (!match) return null
  const level = accessLevel(profile)
  const sections = PROJECT_SECTIONS.filter(
    (s) =>
      canOpenProjectSection(s.slug, level) &&
      (s.slug !== "assessment" || level === "stakeholder" || isLead),
  )
  const base = `/projects/${match.ref}`

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={t("allProjects")}
            className="blend-ink"
            render={<PrefetchLink href="/projects" />}
          >
            <RiArrowLeftLine />
            <span>{t("allProjects")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={project?.name}
            className="blend-ink"
            render={<PrefetchLink href={base} />}
          >
            <ProjectAvatar
              id={project?.id ?? match.ref}
              name={project?.name ?? "P"}
              className="size-4 rounded-[5px]"
            />
            <span className="truncate">{project?.name ?? "…"}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      {/* Same rows as the main nav: the active fill slides between them. */}
      {/* Same 4px step as between rows, so the list reads as one. */}
      <SidebarMenu className="relative mt-1">
        <SlidingIndicator
          activeSelector="[data-active]"
          className="bg-sidebar-active blend-light rounded-full"
          shadowClassName="rounded-full shadow-(--elev-2)"
        />
        {sections.map((section) => {
          const title = PROJECT_SECTION_KEYS[section.slug]
            ? t(PROJECT_SECTION_KEYS[section.slug])
            : section.name
          return (
            <SidebarMenuItem key={section.slug}>
              <SidebarMenuButton
                tooltip={title}
                isActive={match.slug === section.slug}
                className="not-data-active:blend-ink data-active:bg-transparent"
                render={
                  <PrefetchLink
                    href={section.slug ? `${base}/${section.slug}` : base}
                  />
                }
              >
                <section.icon />
                <span className="truncate">{title}</span>
                {section.slug === "assessment" && isLead && (
                  <span className="bg-primary/10 text-primary ml-auto rounded-full px-1.5 py-px text-[11px] leading-4 font-medium">
                    {t("projectLeadBadge")}
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
