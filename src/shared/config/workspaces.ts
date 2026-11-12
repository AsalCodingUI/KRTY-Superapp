import { siteConfig } from "@/app/siteConfig"
import type { MessageKey } from "@/shared/i18n/messages"
import { accessLevel } from "@/shared/config/access"
import { isAdminRole } from "@/shared/lib/roles"
import {
  RemixiconComponentType,
  RiBankCardLine,
  RiBarChartBoxLine,
  RiBookOpenLine,
  RiBriefcaseLine,
  RiFlowLine,
  RiCalendarCheckLine,
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiCupLine,
  RiStickyNoteLine,
  RiFileTextLine,
  RiFolderLine,
  RiGroupLine,
  RiHome2Line,
  RiHouseWindowLine,
  RiInboxLine,
  RiSettings3Line,
  RiUserSmileLine,
  RiWalletLine,
} from "@/shared/ui/lucide-icons"

/**
 * Two-level navigation: the rail switches between workspaces, the sub sidebar
 * lists the pages of the active one (Personal, Project). Pages are the existing routes; which
 * workspace a route belongs to can depend on the role (e.g. /leave is the
 * personal view for employees and the approval center for stakeholders).
 */

export type WorkspaceId = "personal" | "project" | "leads"

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
  /** More paths that light this row up (pages reached from inside it). */
  match?: string[]
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
/** PMs and stakeholders (access.ts PM_UP). */
const isPmUp = (p: WorkspaceProfile) => accessLevel(p) !== "employee"
const links = siteConfig.baseLinks

/**
 * Always at the top of the sidebar, whichever workspace is open: the pages
 * you reach for every day. Notifications sit among them (app-sidebar.tsx).
 */
export const globalItems = (): WorkspaceItem[] => [
  { name: "home", href: links.dashboard, icon: RiHome2Line },
  // One calendar: yours and the team's (Timeline, Minggu, Bulan).
  { name: "calendar", href: links.calendar, icon: RiCalendarLine },
  // Your tasks across projects.
  {
    name: "myTasks",
    href: `${links.projects}/my-tasks`,
    icon: RiCheckboxCircleLine,
  },
  // Your own notes and to-do lists: a page of their own (list + editor).
  {
    name: "myNotes",
    href: `${links.projects}/my-notes`,
    icon: RiStickyNoteLine,
  },
]

/**
 * Pages with no row of their own (a scope of another page): named here so
 * tab titles and search still find them.
 */
export const scopePages = (): WorkspaceItem[] => []

export const workspaces: Workspace[] = [
  {
    // Running the office: what's yours for members, everyone's for
    // stakeholders (each page decides by role).
    id: "personal",
    name: "workspacePersonal",
    // A house (Home's, with a window: not Beranda's own icon).
    icon: RiHouseWindowLine,
    items: (p) => [
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
      // Sharing Santuy: the team's sharing sessions, a page of its own (no
      // longer a scope of the calendar).
      {
        name: "sharingSantuy",
        href: `${links.calendar}/santuy`,
        icon: RiCupLine,
      },
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
      {
        // "Semua project": the section itself is called Project.
        name: "allProjects",
        href: links.projects,
        icon: RiFolderLine,
      },
      // Who we work for; PMs and stakeholders.
      {
        name: "clients",
        href: links.clients,
        icon: RiUserSmileLine,
        can: isPmUp,
      },
      // Project templates (phases → steps → tasks); PMs and stakeholders.
      {
        name: "processes",
        href: links.processes,
        icon: RiFlowLine,
        can: isPmUp,
      },
      // How invoices get paid + the studio profile; PMs and stakeholders.
      {
        name: "paymentMethods",
        href: links.paymentMethods,
        icon: RiBankCardLine,
        can: isPmUp,
      },
    ],
  },
  {
    // The sites PMs and stakeholders find and answer leads on (Gmail,
    // Telegram, Dribbble, Behance, their own): the panel lists them
    // (LeadsNav), each opening in the app (Kretya Flow) over the sheet.
    id: "leads",
    name: "workspaceLeads",
    icon: RiInboxLine,
    can: isPmUp,
    items: () => [
      { name: "leadsManage", href: links.leads, icon: RiSettings3Line },
    ],
  },
]

/** Longest-prefix match, mirroring the permission check in middleware. */
export function matchesRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** How well an item matches the path: its longest matching prefix, or 0. */
export function itemMatch(pathname: string, item: WorkspaceItem) {
  return Math.max(
    0,
    ...[item.href, ...(item.match ?? [])]
      .filter((href) => matchesRoute(pathname, href))
      .map((href) => href.length),
  )
}

/**
 * The workspace whose page best matches the path (longest href wins), so
 * /projects/<id> lands in Project and /leave in Kantor. Null on a global
 * page (Beranda, Kalender, Tugas saya): the sidebar keeps its workspace.
 */
export function resolveWorkspace(
  pathname: string,
  visible: { id: WorkspaceId; items: WorkspaceItem[] }[],
): WorkspaceId | null {
  const global = Math.max(
    0,
    ...globalItems().map((item) => itemMatch(pathname, item)),
  )
  let best: { id: WorkspaceId; length: number } | null = null
  for (const ws of visible) {
    for (const item of ws.items) {
      const length = itemMatch(pathname, item)
      if (length > global && (!best || length > best.length))
        best = { id: ws.id, length }
    }
  }
  return best?.id ?? null
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
