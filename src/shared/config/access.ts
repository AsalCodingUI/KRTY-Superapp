/**
 * Who may open what — the one place for it. Three layers:
 *
 * 1. Access level (from role + job title) decides which pages exist for you.
 * 2. Project membership decides which projects you can open (see
 *    app/(main)/projects/[id]/access.ts and can_access_project in the DB).
 * 3. Job title, team and employment status are profile data only; they never
 *    grant access, except "Project Manager" which makes the "pm" level.
 *
 * Middleware, the sidebar and the pages all read this file, so they can't
 * disagree. To change who sees a page, edit PAGE_ACCESS.
 */

export type AccessLevel = "employee" | "pm" | "stakeholder"

export type AccessProfile = {
  role?: string | null
  job_title?: string | null
}

export function accessLevel(profile?: AccessProfile | null): AccessLevel {
  if (profile?.role === "stakeholder") return "stakeholder"
  if (profile?.job_title === "Project Manager") return "pm"
  return "employee"
}

const EVERYONE: AccessLevel[] = ["employee", "pm", "stakeholder"]
const STAKEHOLDER: AccessLevel[] = ["stakeholder"]
const PM_UP: AccessLevel[] = ["pm", "stakeholder"]

/**
 * Page prefix → levels that may open it. Longest matching prefix wins; a path
 * no prefix covers isn't gated here (Next renders its 404).
 */
export const PAGE_ACCESS: Record<string, AccessLevel[]> = {
  "/dashboard": EVERYONE,
  "/calendar": EVERYONE,
  "/leave": EVERYONE,
  "/performance": EVERYONE,
  "/policies": EVERYONE,
  "/contracts": EVERYONE,
  // What changed in the app, with guides (entries filter by level).
  "/whats-new": EVERYONE,
  // Which projects: membership (stakeholders see all).
  "/projects": EVERYONE,
  // PM-only extras go here, e.g. "/some-page": ["pm", "stakeholder"].
  // Running the office.
  "/teams": STAKEHOLDER,
  "/finance": STAKEHOLDER,
  // PMs edit clients (not delete), process templates and payment methods.
  "/clients": PM_UP,
  "/processes": PM_UP,
  "/payment-methods": PM_UP,
  // Leads: the sites PMs and stakeholders find clients on (Kretya Flow
  // shows them in the app).
  "/leads": PM_UP,
  // Kretya Wiki: the studio's shared pages; everyone reads and writes.
  "/wiki": EVERYONE,
  // Password: the studio's Vaultwarden (vault.kretyastudio.com) in the app,
  // stakeholders only (its own accounts decide what each sees).
  "/vault": STAKEHOLDER,
  // PMs manage their projects' invoices.
  "/invoice-print": PM_UP,
  "/settings": STAKEHOLDER,
  // The UI docs: each component's rules, live on mock data (docs/ui).
  "/ui": STAKEHOLDER,
  // Kretya Flow's own settings (notifications, login item): everyone.
  "/settings/app": EVERYONE,
}

function matches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** The PAGE_ACCESS entry covering a path, or null when none does. */
export function pageRule(pathname: string): AccessLevel[] | null {
  const prefix = Object.keys(PAGE_ACCESS)
    .filter((p) => matches(pathname, p))
    .sort((a, b) => b.length - a.length)[0]
  return prefix ? PAGE_ACCESS[prefix] : null
}

export function canOpenPage(pathname: string, level: AccessLevel) {
  const rule = pageRule(pathname)
  return rule ? rule.includes(level) : true
}

/** Project sections (PROJECT_SECTIONS slugs) only stakeholders get. */
export const STAKEHOLDER_PROJECT_SECTIONS: string[] = []
/**
 * Sections PMs get too: invoices and settings (process, client, portal,
 * team, deleting). PMs only open projects they're on, so these are theirs.
 */
export const PM_PROJECT_SECTIONS = ["invoices", "settings"]

export function canOpenProjectSection(slug: string, level: AccessLevel) {
  if (level === "stakeholder") return true
  if (PM_PROJECT_SECTIONS.includes(slug)) return level === "pm"
  return !STAKEHOLDER_PROJECT_SECTIONS.includes(slug)
}

/**
 * Who runs projects: creating them and moving them between statuses
 * ("Pindahkan ke", dragging on the board/list). The DB agrees: PMs insert
 * projects and change the status of projects they're on (migrations/
 * project_categories.sql). Editing, staffing and deleting stay stakeholder.
 */
export function canRunProjects(level: AccessLevel) {
  return level === "pm" || level === "stakeholder"
}

/**
 * Who manages a project: phases, team, process, client, client portal,
 * invoices, deleting it. Stakeholders, and PMs on that project
 * (is_project_pm in the DB, migrations/pm_project_management*.sql).
 */
export function canManageProject(level: AccessLevel, isMember: boolean) {
  return level === "stakeholder" || (level === "pm" && isMember)
}
