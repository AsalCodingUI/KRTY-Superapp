"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumbTrail, type Crumb } from "@/components/page-breadcrumbs"
import { matchProjectPath } from "@/shared/config/project-sections"
import { useProjectSummary } from "@/shared/hooks/useProjectSummary"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { workspaces } from "@/shared/config/workspaces"
import { PROJECT_SECTION_KEYS } from "@/components/nav-project"
import { useT } from "@/shared/i18n/client"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

/** Current section, taken from the navigation config (fallback: path). */
function useSection(): Crumb {
  const pathname = usePathname()
  const t = useT("nav")
  const items = workspaces.flatMap((ws) => [
    ...ws.items({ role: "stakeholder", is_super_admin: true }),
    ...ws.items({ role: "employee" }),
  ])
  const match = items
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]
  if (match) return { label: t(match.name), href: match.href }
  if (pathname.startsWith("/settings")) return { label: t("settings") }
  const seg = pathname.split("/").filter(Boolean)[0] ?? "dashboard"
  return {
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: `/${seg}`,
  }
}

export function SiteHeader() {
  const t = useT("nav")
  const section = useSection()
  const pathname = usePathname()
  const projectPath = matchProjectPath(pathname)
  const { data: project } = useProjectSummary(projectPath?.id)
  const extra = useBreadcrumbTrail()

  // Section (or the project trail), then whatever the page adds; every step
  // but the last links back up.
  const trail: Crumb[] = [
    ...(projectPath
      ? [
          { label: t("projects"), href: "/projects" },
          { label: project?.name ?? "…", href: `/projects/${projectPath.id}` },
          {
            label: PROJECT_SECTION_KEYS[projectPath.section.slug]
              ? t(PROJECT_SECTION_KEYS[projectPath.section.slug])
              : projectPath.section.name,
            href: `/projects/${projectPath.id}${projectPath.slug ? `/${projectPath.slug}` : ""}`,
          },
        ]
      : [section]),
    ...extra,
  ]

  return (
    <header className="flex h-12 shrink-0 items-center gap-2">
      <div className="gutter-x flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-nowrap">
            {trail.map((crumb, i) => {
              const last = i === trail.length - 1
              return (
                <Fragment key={`${i}-${crumb.label}`}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem className={last ? "min-w-0" : "shrink-0"}>
                    {last || !crumb.href ? (
                      <BreadcrumbPage className="truncate font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        render={<Link href={crumb.href} prefetch={false} />}
                        className="max-w-48 truncate"
                      >
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
