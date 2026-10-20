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
  RiCalculatorLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiFileTextLine,
  RiFolderLine,
  RiGroupLine,
  RiHome2Line,
  RiLockLine,
  RiTeamLine,
  RiUserLine,
} from "@/shared/ui/lucide-icons"

/**
 * Two-level navigation: the rail switches between workspaces, the sub sidebar
 * lists the pages of the active one (Personal, Project, Human Resource). Pages are the existing routes; which
 * workspace a route belongs to can depend on the role (e.g. /leave is the
 * personal view for employees and the approval center for stakeholders).
 */

export type WorkspaceId = "personal" | "project" | "hr"

export type WorkspaceProfile = {
  role?: string | null
  job_title?: string | null
  is_super_admin?: boolean | null
}

export interface WorkspaceItem {
  name: string
  href: string
  icon: RemixiconComponentType
  /** Extra in-app rule on top of the page permission (route gating). */
  can?: (profile: WorkspaceProfile) => boolean
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
      // Stakeholders manage these from Human Resource instead.
      ...(isAdmin(p)
        ? []
        : [
            {
              name: "Leave & Attendance",
              href: links.leave,
              icon: RiCalendarCheckLine,
            },
            {
              name: "Performance",
              href: links.performance,
              icon: RiBarChartBoxLine,
            },
          ]),
    ],
  },
  {
    id: "project",
    name: "Project",
    icon: RiBriefcaseLine,
    items: () => [
      { name: "Calendar", href: links.calendar, icon: RiCalendarLine },
      { name: "Projects", href: links.projects, icon: RiFolderLine },
      {
        name: "Calculator",
        href: `${links.projects}/calculator`,
        icon: RiCalculatorLine,
        can: (p) => canAccessProjectCalculator(p),
      },
      {
        name: "SLA Generator",
        href: `${links.projects}/sla`,
        icon: RiFileTextLine,
        can: (p) => canAccessSLAGenerator(p),
      },
    ],
  },
  {
    id: "hr",
    name: "Human Resource",
    icon: RiTeamLine,
    can: isAdmin,
    items: () => [
      { name: "Team", href: links.teams, icon: RiGroupLine },
      {
        name: "Leave & Attendance",
        href: links.leave,
        icon: RiCalendarCheckLine,
      },
      {
        name: "Performance",
        href: links.performance,
        icon: RiBarChartBoxLine,
      },
      {
        name: "Team Access",
        href: links.settings.teamAccess,
        icon: RiGroupLine,
      },
      {
        name: "Permissions",
        href: links.settings.permission,
        icon: RiLockLine,
        // Hard rule in middleware: super admins only.
        can: (p) => p.is_super_admin === true,
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
 * /projects/calculator lands in Project and /settings/team-access in HR.
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
