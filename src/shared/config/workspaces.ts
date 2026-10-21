import { siteConfig } from "@/app/siteConfig"
import {
  canAccessProjectCalculator,
  canAccessSLAGenerator,
  isAdminRole,
} from "@/shared/lib/roles"
import {
  RemixiconComponentType,
  RiBarChartBoxLine,
  RiBriefcaseLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiFolderLine,
  RiGroupLine,
  RiHome2Line,
  RiUserLine,
} from "@/shared/ui/lucide-icons"

/**
 * Two-level navigation: the rail switches between workspaces, the sub sidebar
 * lists the pages of the active one (Personal, Project). Pages are the existing routes; which
 * workspace a route belongs to can depend on the role (e.g. /leave is the
 * personal view for employees and the approval center for stakeholders).
 */

export type WorkspaceId = "personal" | "project"

export type WorkspaceProfile = {
  role?: string | null
  job_title?: string | null
  is_super_admin?: boolean | null
}

export interface WorkspaceSubItem {
  name: string
  /** The first sub-item is the page's default tab and uses the parent href. */
  href: string
  can?: (profile: WorkspaceProfile) => boolean
}

export interface WorkspaceItem {
  name: string
  href: string
  icon: RemixiconComponentType
  /** Extra in-app rule on top of the page permission (route gating). */
  can?: (profile: WorkspaceProfile) => boolean
  /** The page's tabs, shown nested under it while it is open. */
  children?: WorkspaceSubItem[]
}

export interface Workspace {
  id: WorkspaceId
  name: string
  icon: RemixiconComponentType
  /** Whether the workspace exists for this profile at all. */
  can?: (profile: WorkspaceProfile) => boolean
  items: (profile: WorkspaceProfile) => WorkspaceItem[]
}

const isAdmin = (p: WorkspaceProfile) => isAdminRole(p.role)
const links = siteConfig.baseLinks

export const workspaces: Workspace[] = [
  {
    id: "personal",
    name: "Personal",
    icon: RiUserLine,
    items: (p) => [
      { name: "Home", href: links.dashboard, icon: RiHome2Line },
      // Personal schedule; same calendar for now, its own view comes later.
      {
        name: "Calendar",
        href: `${links.calendar}/personal`,
        icon: RiCalendarLine,
      },
      // Stakeholders also manage the team from here.
      ...(isAdmin(p)
        ? [{ name: "Team", href: links.teams, icon: RiGroupLine }]
        : []),
      {
        name: "Leave & Attendance",
        href: links.leave,
        icon: RiCalendarCheckLine,
        // Mirrors the tabs in StakeholderLeavePage / EmployeeLeavePage.
        children: isAdmin(p)
          ? [
              { name: "Persetujuan", href: links.leave },
              { name: "Kehadiran", href: `${links.leave}/attendance` },
              { name: "Saldo Cuti", href: `${links.leave}/remaining` },
            ]
          : [
              { name: "Kehadiran", href: links.leave },
              { name: "Cuti", href: `${links.leave}/leave` },
            ],
      },
      {
        name: "Performance",
        href: links.performance,
        icon: RiBarChartBoxLine,
        // Mirrors PerformancePage tabs (Team KPI depends on a runtime lead
        // check, so it stays a page tab only).
        children: [
          { name: "KPI", href: links.performance },
          { name: "360 review", href: `${links.performance}/360-review` },
          { name: "Jadwal 1:1", href: `${links.performance}/one-on-one` },
          {
            name: "Kompetensi",
            href: `${links.performance}/competency-library`,
            can: isAdmin,
          },
        ],
      },
    ],
  },
  {
    id: "project",
    name: "Project",
    icon: RiBriefcaseLine,
    items: () => [
      { name: "Calendar", href: links.calendar, icon: RiCalendarLine },
      {
        name: "Projects",
        href: links.projects,
        icon: RiFolderLine,
        children: [
          { name: "Daftar Project", href: links.projects },
          {
            name: "Calculator",
            href: `${links.projects}/calculator`,
            can: (p) => canAccessProjectCalculator(p),
          },
          {
            name: "SLA Generator",
            href: `${links.projects}/sla`,
            can: (p) => canAccessSLAGenerator(p),
          },
        ],
      },
    ],
  },
]

/** Longest-prefix match, mirroring the permission check in middleware. */
export function matchesRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * The workspace whose page best matches the path (longest href wins), so
 * /projects/calculator lands in Project and /calendar/personal in Personal.
 */
export function resolveWorkspace(
  pathname: string,
  visible: { id: WorkspaceId; items: WorkspaceItem[] }[],
): WorkspaceId {
  let best: { id: WorkspaceId; length: number } | null = null
  for (const ws of visible) {
    for (const item of ws.items) {
      if (
        matchesRoute(pathname, item.href) &&
        (!best || item.href.length > best.length)
      ) {
        best = { id: ws.id, length: item.href.length }
      }
    }
  }
  return best?.id ?? "personal"
}

/**
 * Active sub-item: the longest child href that matches; the first child (the
 * page's default tab) when only the parent matches (e.g. /projects/<id>).
 */
export function resolveActiveChild(
  pathname: string,
  children: WorkspaceSubItem[],
): string | undefined {
  const [first, ...rest] = children
  const hit = rest
    .filter((c) => matchesRoute(pathname, c.href))
    .sort((a, b) => b.href.length - a.href.length)[0]
  return hit?.href ?? first?.href
}
