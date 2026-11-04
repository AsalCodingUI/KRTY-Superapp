# Navigation

Moving between pages and views: the sidebar, the top bar and breadcrumbs,
page tabs, view and filter switches, paging, links and URL params. Live
examples: **/ui** → Navigasi.

## Use

| Need                                       | Use                                                                 | File                                                    |
| ------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------- |
| Tabs under a page title                    | `TabNavigation` + `TabNavigationLink active onClick`                | `src/components/tab-navigation.tsx`                     |
| Tabs that are routes (`/x`, `/x/tab`)      | `TabNavigation` + `useTabRoute`                                     | `src/shared/hooks/useTabRoute.ts`                       |
| Switch 2–5 views / filters in place        | `SegmentedControl` (`fitContent` in toolbars)                       | `src/components/segmented-control.tsx`                  |
| List / grid / table / kanban switch        | `ViewToggle` + `useViewMode(key)`                                   | `src/components/view-toggle.tsx`                        |
| Year + quarter filter                      | `QuarterFilter`                                                     | `src/components/quarter-filter.tsx`                     |
| Prev / next under a list                   | `ListPager`                                                         | `src/components/list-pager.tsx`                         |
| Paging a DataTable                         | built in (`DataTablePagination`)                                    | `src/components/data-table/`                            |
| Breadcrumb steps after the section         | `useBreadcrumbs([{ label, href? }])`                                | `src/components/page-breadcrumbs.ts`                    |
| The breadcrumb row itself                  | `SiteHeader` (app), `PortalShell` (portal)                          | `src/components/site-header.tsx`                        |
| Back ← before a page title                 | `PageHeader back={{ href, label }}`                                 | `src/components/page-header.tsx`                        |
| Sidebar                                    | `AppSidebar` → `NavMain`, `NavProject`, `SidebarNotices`, `NavUser` | `src/components/app-sidebar.tsx`                        |
| Sidebar pages (per workspace)              | config, not JSX                                                     | `src/shared/config/workspaces.ts`                       |
| A notice card at the sidebar's bottom      | a hook returning `SidebarNotice` in `useNotices`                    | `src/components/sidebar-notices.tsx`                    |
| Mac app top bar (workspace switch, search) | `AppTopbar`                                                         | `src/components/app-topbar.tsx`                         |
| Phone navigation                           | `MobileNav` → `FloatingTabBar`                                      | `src/components/mobile-nav.tsx`, `floating-tab-bar.tsx` |
| Link to a page                             | `PrefetchLink` (lists, nav) or `Link prefetch={false}`              | `src/components/prefetch-link.tsx`                      |
| Link that only changes the query           | `ParamLink` (`?entry=`, `?policy=`)                                 | `src/components/param-link.tsx`                         |
| State in the URL without a navigation      | `replaceUrl(href, push?)`                                           | `src/shared/lib/url-params.ts`                          |
| A row's URL key, project / person URLs     | `linkKey`, `projectHref`, `employeeHref`, `findByLinkKey`           | same                                                    |

## Rules

**Tabs vs segmented vs view toggle**

- `TabNavigation`: the sections of a page (Ringkasan / Langganan,
  Berlaku / Draft). Underline style, `text-sm font-medium`, `gap-7`,
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
- A count after the label: `<span className="text-tertiary-foreground
ml-1.5 tabular-nums">`, hidden at 0 (badge.md).

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

**Breadcrumbs**

- Built by `SiteHeader` from the nav config (section) or the project path
  (Projects › name › section), then the page's own steps from
  `useBreadcrumbs`. Every step but the last links back. Hidden on phones
  (they have the title and the tab bar).
- Pages add steps only for what's below the section (a folder, an edited
  item); don't repeat the section.

**Sidebar**

- Pages come from `shared/config/workspaces.ts`; the active page is the
  longest matching href. One sliding active fill (`bg-sidebar-active`)
  across rows.
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
className="border-b-0">` (see Migration).
- Tab counts in a pill (`TabNavigationLink badge`).
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

<PageHeader className="pt-6 pb-4" title="Aturan" actions={<ViewToggle value={view} onValueChange={setView} />} />
<TabNavigation className="mb-4">
  {TABS.map((item) => (
    <TabNavigationLink
      key={item.value}
      active={tab === item.value}
      onClick={() => setTab(item.value)}
      showLeadingIcon={false}
    >
      {item.label}
      {count > 0 && (
        <span className="text-tertiary-foreground ml-1.5 tabular-nums">{count}</span>
      )}
    </TabNavigationLink>
  ))}
</TabNavigation>
```

## Migration notes

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
