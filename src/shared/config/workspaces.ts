import { siteConfig } from "@/app/siteConfig"
import type { MessageKey } from "@/shared/i18n/messages"
import { isAdminRole } from "@/shared/lib/roles"
import {
  RemixiconComponentType,
  RiBankCardLine,
  RiBarChartBoxLine,
  RiBookOpenLine,
  RiBriefcaseLine,
  RiBuildingLine,
  RiFlowLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiStickyNoteLine,
  RiFileTextLine,
  RiFolderLine,
  RiGroupLine,
  RiHome2Line,
  RiUserLine,
  RiWalletLine,
} from "@/shared/ui/lucide-icons"

/**
 * Two-level navigation: the rail switches between workspaces, the sub sidebar
 * lists the pages of the active one (Personal, Project). Pages are the existing routes; which
 * workspace a route belongs to can depend on the role (e.g. /leave is the
 * personal view for employees and the approval center for stakeholders).
 */

export type WorkspaceId = "personal" | "project"

/** Page and workspace names are "nav" message keys, translated where shown. */
export type NavKey = MessageKey<"nav">

export type WorkspaceProfile = {
  role?: string | null
  job_title?: string | null
  is_super_admin?: boolean | null
}

export interface WorkspaceSubItem {
  name: NavKey
  /** The first sub-item is the page's default tab and uses the parent href. */
  href: string
  can?: (profile: WorkspaceProfile) => boolean
}

export interface WorkspaceItem {
  name: NavKey
  href: string
  icon: RemixiconComponentType
  /** Extra in-app rule on top of the page permission (route gating). */
  can?: (profile: WorkspaceProfile) => boolean
  /** The page's tabs, shown nested under it while it is open. */
  children?: WorkspaceSubItem[]
}

export interface Workspace {
  id: WorkspaceId
  name: NavKey
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
    name: "workspacePersonal",
    icon: RiUserLine,
    items: (p) => [
      { name: "home", href: links.dashboard, icon: RiHome2Line },
      // Your own agenda: events, 1:1s, leave, task deadlines, Sharing Santuy.
      {
        name: "calendar",
        href: `${links.calendar}/personal`,
        icon: RiCalendarLine,
      },
      // Stakeholders also manage the team from here.
      ...(isAdmin(p)
        ? ([
            {
              name: "team",
              href: links.teams,
              icon: RiGroupLine,
              // Directory and members & access are one page; super admins
              // switch between them with the page's segmented control.
            },
          ] satisfies WorkspaceItem[])
        : []),
      {
        name: "leaveAttendance",
        href: links.leave,
        icon: RiCalendarCheckLine,
        // Mirrors the tabs in StakeholderLeavePage. Members get one page:
        // requests and attendance together.
        children: isAdmin(p)
          ? [
              { name: "leaveApprovals", href: links.leave },
              { name: "leaveAttendanceTab", href: `${links.leave}/attendance` },
              { name: "leaveBalance", href: `${links.leave}/remaining` },
            ]
          : undefined,
      },
      {
        name: "performance",
        href: links.performance,
        icon: RiBarChartBoxLine,
        // Mirrors PerformancePage tabs (Team KPI depends on a runtime lead
        // check, so it stays a page tab only). Members get one page: KPI,
        // 360 and 1:1 together.
        children: isAdmin(p)
          ? [
              { name: "performanceKpi", href: links.performance },
              {
                name: "performance360",
                href: `${links.performance}/360-review`,
              },
              {
                name: "performanceOneOnOne",
                href: `${links.performance}/one-on-one`,
              },
              {
                name: "performanceCompetency",
                href: `${links.performance}/competency-library`,
              },
            ]
          : undefined,
      },
      // Money in and recurring costs; stakeholders only.
      ...(isAdmin(p)
        ? ([
            {
              name: "finance",
              href: links.finance,
              icon: RiWalletLine,
              children: [
                { name: "financeOverview", href: links.finance },
                {
                  name: "financeSubscriptions",
                  href: `${links.finance}/subscriptions`,
                },
              ],
            },
          ] satisfies WorkspaceItem[])
        : []),
      // Office rules: everyone reads, stakeholders write.
      { name: "policies", href: links.policies, icon: RiBookOpenLine },
      // Employment contracts: employees see their own, stakeholders all.
      { name: "contracts", href: links.contracts, icon: RiFileTextLine },
    ],
  },
  {
    id: "project",
    name: "workspaceProject",
    icon: RiBriefcaseLine,
    items: () => [
      // First item = where switching to this workspace lands.
      {
        name: "projects",
        href: links.projects,
        icon: RiFolderLine,
      },
      // The viewer's tasks across all their projects.
      {
        name: "myTasks",
        href: `${links.projects}/my-tasks`,
        icon: RiCheckboxCircleLine,
      },
      // The viewer's private notes and to-do lists.
      {
        name: "myNotes",
        href: `${links.projects}/my-notes`,
        icon: RiStickyNoteLine,
      },
      { name: "calendar", href: links.calendar, icon: RiCalendarLine },
      // Who we work for; stakeholders only.
      {
        name: "clients",
        href: links.clients,
        icon: RiBuildingLine,
        can: isAdmin,
      },
      // Project templates (phases → steps → tasks); stakeholders only.
      {
        name: "processes",
        href: links.processes,
        icon: RiFlowLine,
        can: isAdmin,
      },
      // How invoices get paid + the studio profile; stakeholders only.
      {
        name: "paymentMethods",
        href: links.paymentMethods,
        icon: RiBankCardLine,
        can: isAdmin,
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
 * /projects/<id> lands in Project and /calendar/personal in Personal.
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
