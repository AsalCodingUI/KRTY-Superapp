"use client"

import { ProjectAvatar } from "@/components/project-avatar"
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
import { useProjectSummary } from "@/shared/hooks/useProjectSummary"
import { RiArrowLeftLine } from "@/shared/ui/lucide-icons"
import Link from "next/link"
import { usePathname } from "next/navigation"

/** Sub sidebar while a project is open: back, the project, its pages. */
export function NavProject() {
  const pathname = usePathname()
  const match = matchProjectPath(pathname)
  const { data: project } = useProjectSummary(match?.id)
  if (!match) return null
  const base = `/projects/${match.id}`

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="text-muted-foreground"
            render={<Link href="/projects" prefetch={false} />}
          >
            <RiArrowLeftLine />
            <span>Semua project</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="font-medium"
            render={<Link href={base} prefetch={false} />}
          >
            <ProjectAvatar
              id={match.id}
              name={project?.name ?? "P"}
              className="size-4 rounded-[4px]"
            />
            <span className="truncate">{project?.name ?? "…"}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarMenu className="mt-2">
        {PROJECT_SECTIONS.map((section) => (
          <SidebarMenuItem key={section.slug}>
            <SidebarMenuButton
              isActive={match.slug === section.slug}
              render={
                <Link
                  href={section.slug ? `${base}/${section.slug}` : base}
                  prefetch={false}
                />
              }
            >
              <section.icon />
              <span>{section.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
