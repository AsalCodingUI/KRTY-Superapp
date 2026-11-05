# Navigation

Moving between pages and views: the sidebar, the in-app tabs,
page tabs, view and filter switches, paging, links and URL params. Live
examples: **/ui** → Navigasi.

## Use

| Need                                        | Use                                                                           | File                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| Tabs under a page title                     | `TabNavigation` + `TabNavigationLink active onClick`                          | `src/components/tab-navigation.tsx`                       |
| Tabs that are routes (`/x`, `/x/tab`)       | `TabNavigation` + `useTabRoute`                                               | `src/shared/hooks/useTabRoute.ts`                         |
| Switch 2–5 views / filters in place         | `SegmentedControl` (`fitContent` in toolbars)                                 | `src/components/segmented-control.tsx`                    |
| List / grid / table / kanban switch         | `ViewToggle` + `useViewMode(key)`                                             | `src/components/view-toggle.tsx`                          |
| Year + quarter filter                       | `QuarterFilter`                                                               | `src/components/quarter-filter.tsx`                       |
| Prev / next under a list                    | `ListPager`                                                                   | `src/components/list-pager.tsx`                           |
| Paging a DataTable                          | built in (`DataTablePagination`)                                              | `src/components/data-table/`                              |
| Name the page's tab (and the portal crumbs) | `useBreadcrumbs([{ label, href? }])`: the last step is the tab title          | `src/components/page-breadcrumbs.ts`                      |
| The tab row (app)                           | `SiteHeader` → `TabStrip`, `useAppTabsSync`                                   | `src/components/site-header.tsx`, `src/widgets/app-tabs/` |
| Back / forward in a tab                     | `TabHistoryButtons` (sidebar brand row; tab row when collapsed)               | `src/widgets/app-tabs/ui/AppTabs.tsx`                     |
| Open a link as a tab from code              | `window.dispatchEvent(new CustomEvent("krty:open-tab", { detail: { url } }))` | same                                                      |
| Breadcrumb row (portal only)                | `PortalShell`                                                                 | `src/page-slices/projects/ui/portal/PortalShell.tsx`      |
| Back ← before a page title                  | `PageHeader back={{ href, label }}`                                           | `src/components/page-header.tsx`                          |
| Sidebar                                     | `AppSidebar` → `NavMain`, `NavProject`, `SidebarNotices`, `NavUser`           | `src/components/app-sidebar.tsx`                          |
| Sidebar pages (per workspace)               | config, not JSX                                                               | `src/shared/config/workspaces.ts`                         |
| A notice card at the sidebar's bottom       | a hook returning `SidebarNotice` in `useNotices`                              | `src/components/sidebar-notices.tsx`                      |
| Phone top bar / Mac traffic-light strip     | `AppTopbar` (account: `AccountMenu`)                                          | `src/components/app-topbar.tsx`                           |
| Phone navigation                            | `MobileNav` → `FloatingTabBar`                                                | `src/components/mobile-nav.tsx`, `floating-tab-bar.tsx`   |
| Link to a page                              | `PrefetchLink` (lists, nav) or `Link prefetch={false}`                        | `src/components/prefetch-link.tsx`                        |
| Link that only changes the query            | `ParamLink` (`?entry=`, `?policy=`)                                           | `src/components/param-link.tsx`                           |
| State in the URL without a navigation       | `replaceUrl(href, push?)`                                                     | `src/shared/lib/url-params.ts`                            |
| A row's URL key, project / person URLs      | `linkKey`, `projectHref`, `employeeHref`, `findByLinkKey`                     | same                                                      |

## App tabs

The shell has no top bar from `md` up. The sidebar's top: the brand;
the workspaces as icon + label tabs (`WorkspaceTabs`, not a segmented
control; optical padding 11 / 13px; the sidebar is 15.5rem by default and never narrower, so both tabs and the bell fit)
with the bell (icon only) at that row's end; search (⌘K, an outlined
pill). Its bottom: notices, What's new, Settings, the account row (same
list, same icon column), then theme and chrome color; language lives in
Settings only. Sidebar icons centre on one column (30px from the edge),
labels start at 48px, rows sit 4px apart. Above the page sheet, on the
chrome: the sidebar toggle, ‹ › (the active tab's history), then the
tabs, level with the brand row. The Mac app keeps its toggle by the
traffic lights.

- **Main** is the first tab and can't be closed. The sidebar and every
  plain link navigate the active tab, like a browser's.
- **New tabs**: ⌘ / Ctrl / middle click on an app link (opens in the
  background), the right-click menu's "Buka di tab baru", or `+` (opens
  Beranda). At most 10; the oldest background tab gives way.
- **Closing**: × on the tab, middle click, or right-click a tab → Tutup
  tab / Tutup tab lain (keeps Main and that tab) / Tutup semua tab (Main
  only, and it becomes active). Desktop app: ⌘W, ⌘⇧W.
- **History is per tab**: ‹ › and ⌘[ ⌘] move inside the active tab. A
  query change (filters, `?tab=`) replaces the entry, a new path adds one;
  `?settings=` is ignored.
- **Only the active tab renders.** The others are a URL, a title, an icon
  and a scroll offset (restored on return). Saved per user in localStorage.
- The tab title is the page's last step: `useBreadcrumbs` if the page sets
  it, else the project (+ section) or the sidebar section.
- **Look**: pills on the chrome (`h-8 rounded-control text-meta`, icon
  `size-3.5`; row `pt-3 pb-2`). The active one
  is a raised white pill (`bg-chrome-active shadow-raised`) and has its ×; the
  others are plain text, `bg-chrome-hover` and × on hover. The row stays
  put; only the sheet below scrolls.
- **States**: the active tab shows a spinner in place of its icon until
  its page has rendered (switching, `+`, a just-opened tab); a tab not
  visited yet is named and iconed after its sidebar section, then after
  the page once it loads.
- **Speed**: the tab lights up on press (pointer down) and the route
  renders a frame later; every other tab's page is prefetched when the
  browser is idle (and again on hover), and with `staleTimes.dynamic: 30`
  switching back within 30s reuses the cached page. Tabs save to
  localStorage when idle, never during a switch.
- Desktop app only: ⌘T, ⌘W, ⌘⇧W, ⌘1–9, ⌃Tab (browsers keep those keys).
- Phones: no tab row; `MobileNav` as before.

## Tab options (use these)

On `TabNavigation` / `TabNavigationLink` (`src/components/tab-navigation.tsx`);
measured on /ui → Navigasi ("Diukur dari CSS yang jalan").

| Need                             | Use                           | Result                                                      |
| -------------------------------- | ----------------------------- | ----------------------------------------------------------- |
| Page tabs with a line under them | `TabNavigation` (default)     | 1px `border-border` line, tabs `gap-6`, `h-8`               |
| Tabs inside a toolbar (no line)  | `TabNavigation plain`         | no line, same underline on the active tab                   |
| A line edge to edge of the page  | `TabNavigation bleed`         | `bleed gutter-x border-b` wrapper (Performa)                |
| A count after the label          | `TabNavigationLink count={n}` | `text-tertiary-foreground ml-1.5 tabular-nums`, hidden at 0 |
| Keyboard focus                   | built in                      | `ring-2 ring-focus-ring` (same as fields)                   |

## Rules

**Tabs vs segmented vs view toggle**

- `TabNavigation`: the sections of a page (Ringkasan / Langganan,
  Berlaku / Draft). Underline style, `text-sm font-medium`, `gap-6`,
  one sliding `bg-primary` underline. Sits right under `PageHeader`,
  before the content; `mb-4` (or the page's flex gap) below.
- `SegmentedControl`: a switch inside content or a toolbar (scope,
  period, Bulan / Minggu, form choices). Pill, `h-8`, sliding thumb.
  `fitContent` unless it should fill its row. Not for page sections.
- `ViewToggle`: only list / grid / table / kanban, icons only; the choice
  is remembered per page with `useViewMode("<page>")`. Right side of the
  page toolbar.
- Never `Tabs` from `ui/tabs.tsx` (one leftover, see Migration).

**Tab labels**

- Text only (`showLeadingIcon={false}`), short nouns.
- A count after the label: `count={n}` (`text-tertiary-foreground ml-1.5
tabular-nums`, hidden at 0; badge.md).

**Where the state lives**

- A tab that is its own page (bookmarkable, server data): a route
  (`/finance`, `/finance/subscriptions`; `useTabRoute`).
- A filter or tab on one page's data: a query param, written with
  `replaceUrl` (no server round trip), default value = no param
  (`PoliciesPage` `?status=`).
- An open window over a list (detail sheet, dialog): `?<thing>=<linkKey>`
  with `ParamLink` or `replaceUrl(href, true)` so Back closes it.
- A per-person look preference (list vs grid): `useViewMode`
  (localStorage), not the URL.
- Param names in English, one per idea (`?period=2026-Q4`, `?project=`,
  `?member=`, `?task=`, `?report=`); row keys are `linkKey(name, id)`
  (`desain-logo-3f9a1c2b`). Old Indonesian names are renamed by the
  middleware (`LEGACY_QUERY_PARAMS`); never add new ones.

**Links**

- Anything that navigates is a link (`<a>`): a `Button` renders it with
  `nativeButton={false} render={<Link … />}`.
- `prefetch={false}` on every `next/link` (viewport prefetch runs the
  auth middleware); `PrefetchLink` prefetches on hover / focus / touch
  instead. Sidebar rows and list rows use `PrefetchLink`.
- `router.push` only after an action (created → go to it), not as a
  button's click handler for plain navigation.

**Breadcrumbs (now tab titles)**

- The app no longer draws a breadcrumb row: the tabs replaced it. The
  page's steps from `useBreadcrumbs` still matter: the last one names the
  tab. Going up a level is the page's own back link (`PageHeader back`).
- Pages add steps only for what's below the section (a folder, an edited
  item); don't repeat the section. The client portal keeps its crumbs.

**Sidebar**

- Pages come from `shared/config/workspaces.ts`; the active page is the
  longest matching href. One sliding active fill (`bg-sidebar-active`
  = `--chrome-selected`: a darker see-through fill, flat, no shadow)
  across rows; the Personal | Project tabs use the same fill. The white
  raised pill is only for the app tabs.
- Row extras: count `badge` (`NavBadge`, 99+), `dot` for "new" without a
  count (`NavDot`), sub-tabs listed under the open page.
- Inside a project the sidebar swaps to `NavProject` (← Semua project,
  the project's sections).
- Notices (update ready, download the Mac app): `SidebarNoticeCard`, at
  most two, by `NOTICE_PRIORITY`; hidden when collapsed to icons.

**Phones**

- `FloatingTabBar`: dark-glass pill of icon tabs at the bottom (filled
  icon when active, gliding bubble) + a round menu button; `md:hidden`.
  The sidebar and breadcrumbs don't show.

**Paging**

- `ListPager` under a `GroupedList`: "Halaman 2 dari 5" + ‹ › ghost
  icon-sm buttons, right-aligned, hidden for one page. `page` is
  1-based, `onPageChange` gets the zero-based index.
- DataTable pages itself (outline icon buttons, first / last on wide
  screens). Don't add a second pager.

## Don't

- `SegmentedControl` as page tabs, or `TabNavigation` as a form switch.
- `router.replace(\`${pathname}?${params}\`)`to store a filter when the
server doesn't read it:`replaceUrl`.
- `<Link href>` without `prefetch={false}` (or `PrefetchLink`).
- A `<button onClick={() => router.push(href)}>` for a plain link.
- Redrawing the tab line: `<div className="border-b"><TabNavigation
className="border-b-0">`: `plain` / `bleed`.
- A count written by hand in the label, or in a pill: `count`.
- New Indonesian query names (`?proyek=`).

## Good examples

- Page tabs with counts in `?status=`: `src/page-slices/policies/ui/PoliciesPage.tsx`
- Route tabs: `src/page-slices/performance/ui/PerformancePage.tsx` (`useTabRoute`), `src/page-slices/finance/ui/FinancePage.tsx` (one route per tab)
- View toggle + toolbar: `src/page-slices/projects/ui/ProjectsListPage.tsx`
- Query-only links: `src/components/param-link.tsx` users (What's new, Aturan)
- Pager: `src/page-slices/leave/ui/components/EmployeeLeaveList.tsx`
- Breadcrumb steps: `src/page-slices/projects/ui/workspace/ProjectLibrary.tsx` (`useBreadcrumbs`)

## Example

```tsx
const tab = (searchParams.get("status") as Tab | null) ?? "all"
const setTab = (next: Tab) => {
  const params = new URLSearchParams(searchParams.toString())
  if (next === "all") params.delete("status")
  else params.set("status", next)
  replaceUrl(params.size ? `${pathname}?${params}` : pathname)
}

<PageHeader title="Aturan" actions={<ViewToggle value={view} onValueChange={setView} />} />
<TabNavigation className="mb-4">
  {TABS.map((item) => (
    <TabNavigationLink
      key={item.value}
      active={tab === item.value}
      onClick={() => setTab(item.value)}
      count={counts[item.value]}
      showLeadingIcon={false}
    >
      {item.label}
    </TabNavigationLink>
  ))}
</TabNavigation>
```

## Migration notes

Done 2026-11-05 (local): `TabNavigationLink count` (the unused `badge`
pill removed; ClientsPage, PoliciesPage, MyTasksPage, ProjectTasks,
ProjectInvoices on it); `TabNavigation plain` (ProjectTasks,
StakeholderLeavePage) and `bleed` (PerformancePage, now with
`showLeadingIcon={false}`); MyTasksPage's `border-b` wrapper removed;
tab focus ring `ring-2 ring-focus-ring` (and the sidebar notice's
`ring-[var(--ring)]`); `prefetch={false}` on the last 14 `next/link`s
(PortalShell ×4, PortalOverview, MyTasksPage, InvoiceEditorDialog,
ProjectScoringView, BriefDialog, LeaveRules ×2, NotificationsPanel,
error / not-found views), `FloatingTabBar` on `PrefetchLink`;
ReviewResult `Tabs` → `SegmentedControl`. `replaceUrl` where the route
doesn't read the param: ClientsPage (`?status=`, `?client=`; the route
takes no `searchParams`), ContractsPage (`?contract=`, same),
ProjectTasks (`?task=`), ProjectReports (`?report=`), ProjectLibrary
(`?folder=`, `push` so Back goes up a folder) — the project routes pass
the query to `resolveProjectRef` only to keep it on a redirect.
Kept on the router (the server reads the param): EmployeeDashboard
`?period=` (`dashboard/page.tsx` loads the quarter's data), TeamsPage
`?page=` (`teams/page.tsx` pages the query).
Still open: spacing below tabs (`mb-4` vs `gap-6` vs none), ViewToggle as
an icon-only SegmentedControl, one pager look, NavProject's lead tag, the
`ring-[var(--ring)]` focus rings outside navigation (WhatsNewPage /
WhatsNewEditor chips, SettingsDialog nav).
The older list below is kept for reference.

Found Nov 2026; fix in place, then delete the line. Paths under `src/`.

**Tabs**

- Tab line redrawn by a wrapper: `page-slices/projects/ui/my-tasks/MyTasksPage.tsx:364`
  (`border-b` + `TabNavigation border-b-0`), `performance/ui/PerformancePage.tsx:134`
  (`bleed gutter-x border-b`, full-bleed line) → one way; if full-bleed
  lines are wanted, add a `bleed` prop to `TabNavigation`.
- Tabs with no line in a toolbar: `projects/ui/workspace/ProjectTasks.tsx:384`,
  `leave/ui/StakeholderLeavePage.tsx:1105` (`border-b-0`) → a `plain`
  variant on `TabNavigation`, or `SegmentedControl` if they're filters.
- Spacing below tabs differs: `mb-4` (ClientsPage, PoliciesPage),
  `mb-8` (UiDocsPage), parent `gap-6` (ProjectInvoices:469), none
  (FinancePage:235) → `mb-4` / the page gap, one value.
- `components/tab-navigation.tsx:143`: unused `badge` pill; 5 pages
  hand-write the count span (see badge.md) → `count` prop.
- `components/tab-navigation.tsx:110`: focus ring `ring-ring/30 ring-3`
  differs from the app's `ring-2 ring-focus-ring`.
- `performance/ui/review/ReviewResult.tsx:188`: `Tabs` (ui/tabs) →
  `SegmentedControl` + conditional content.
- Missing `showLeadingIcon={false}`: `performance/ui/PerformancePage.tsx:137`,
  `leave/ui/StakeholderLeavePage.tsx:1106` (harmless today, no icon).

**URL state** (`router.replace/push` for a query the server doesn't read → `replaceUrl`)

- `app/(main)/dashboard/components/EmployeeDashboard.tsx:89,96` (quarter),
  `page-slices/clients/ui/ClientsPage.tsx:98` (`go`),
  `contracts/ui/ContractsPage.tsx:104`, `projects/ui/workspace/ProjectReports.tsx:74`,
  `projects/ui/workspace/ProjectTasks.tsx:160`, `projects/ui/workspace/ProjectLibrary.tsx:414`,
  `teams/ui/TeamsPage.tsx:57`. Check each page's server component first:
  keep the router where the server filters by the param.

**Links without `prefetch={false}`**: listed in button.md (Links).

**View switch look**

- `ViewToggle` and `SegmentedControl` draw the same thumb two ways
  (`dark:bg-muted/60` + raw `<button>`s vs `dark:bg-muted` +
  `ToggleGroup`) → make `ViewToggle` an icon-only `SegmentedControl`.

**Pagers**

- `ListPager` is ghost icon-sm, `DataTablePagination` outline icon (with
  an extra `sr-only` span next to `aria-label`) → one look.

**Sidebar**

- `components/nav-project.tsx:124` lead tag hand-made (badge.md).
- `components/sidebar-notices.tsx:121` dismiss × is a raw button (fine,
  floating); its `focus-visible:ring-[var(--ring)]` (`:90`) → the app
  focus ring.
