# Page layout

How a screen is put together: the app shell (top bar, sidebar, the page
sheet, banners), a page's header and sections, stat bands, the minimal
screens (sign in, brief, report, 404), fullscreen routes, the Mac and
Windows apps, phones and print. Live examples: **/ui** → Layout.

## Use

| Need                                    | Use                                                         | File                                                       |
| --------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| The app around every signed-in page     | automatic (`(main)` layout)                                 | `src/app/(main)/layout.tsx`                                |
| A page's title, ← back, actions         | `PageHeader title back actions className="pt-6 pb-4"`       | `src/components/page-header.tsx`                           |
| Extra breadcrumb steps (Aturan › Edit)  | `useBreadcrumbs([{ label, href }])`                         | `src/components/page-breadcrumbs.ts`                       |
| Headline numbers under the title / tabs | `StatStrip items aside orEmpty`                             | `src/components/stat-strip.tsx`                            |
| The page sheet (app and client portal)  | `PageSheet mac` + `pageSheetContentClassName`               | `src/components/page-sheet.tsx`                            |
| Numbers on cards (dashboards, dialogs)  | `StatTiles items variant="tiles" \| "strip"`                | `src/components/stat-tiles.tsx`                            |
| A quiet heading inside a page           | `SectionTitle extra actions`                                | `src/components/section-title.tsx`                         |
| A titled block around a table           | `TableSection title description actions`                    | `src/components/table-section.tsx`                         |
| Full-width padding on the page          | `gutter-x` (and `bleed` for a band past the content edge)   | `src/app/globals.css`                                      |
| A pane that scrolls                     | `scroll-pane` (+ `pane-px-5` for its own padding)           | `src/app/globals.css`                                      |
| A page outside the app (sign in, PIN)   | `MinimalScreen` + `MinimalCard` + `screen*Class`            | `src/components/minimal-screen.tsx`                        |
| 404 / error                             | `NotFoundView` / `ErrorView` (`StatusPage`)                 | `src/components/not-found-view.tsx`, `status-page.tsx`     |
| Inside Kretya Flow (desktop app)?       | `useMacChrome()` (Mac chrome), `useDesktopShell()` (either) | `src/components/desktop-shell.tsx`                         |
| Phone or not, in JS                     | `useIsMobile()` (under 768px) — prefer CSS `max-md:`        | `src/hooks/use-mobile.ts`                                  |
| A printable page                        | a `(fullscreen)` route with its own `@page` CSS             | `src/page-slices/projects/ui/invoice/InvoicePrintPage.tsx` |

## Anatomy

```
SidebarProvider  bg-chrome h-svh flex-col                      (tinted chrome)
├─ AppTopbar      phones only (56px): brand · bell · account. Mac: 52px strip,
│                  traffic lights + sidebar toggle + the tab row
├─ row            md:pr-2 md:pb-2 (Mac md:pr-1.5 md:pb-1.5)
│  ├─ AppSidebar  18rem (resizable, min 248px), icon 3.75rem, hidden < md
│  │  header: brand · workspace tabs + bell · search (outline pill)
│  │  bottom: notices · What's new · Settings · account · theme / chrome color
│  └─ column
│     ├─ SiteHeader  ◫ ‹ › + the tab row, on the chrome, pt-3 h-8 pb-2 (--app-tabs-height);
│     ├─ AppBannerStack  between the tabs and the sheet, as wide as the sheet;
│     │                  publishes --app-banner-height (view-as, announcements)
│     │              fixed: only the sheet scrolls (widgets/app-tabs)
│     └─ PageSheet   shadow layer + SidebarInset (components/page-sheet.tsx)
│        SidebarInset  scroll-pane · md:rounded-dialog (Mac 10px) · md:pt-6
│        └─ content    gutter-x flex-col gap-4 · pb-6 (phones pb for the tab bar)
│           └─ WorkspaceTransition › Suspense › the page
└─ MobileNav      floating tab bar, phones only (md:hidden)
```

The page sheet is the only scroller: the window never scrolls, the tab
row and sidebar stay. Right sheets and the docked side panel float 8px
inside it (see overlay.md).

## Rules

**Page**

- A page is `<div className="flex flex-col">` that starts with
  `PageHeader className="pt-6 pb-4"`. Then, in this order when present:
  `TabNavigation`, `StatStrip`, a filter/search row (`pt-4 pb-3`), the
  content. Full width on the gutter; no `mx-auto max-w-*` page container
  (documents in dialogs read at `max-w-3xl`).
- One `h1` per page and it is `PageHeader`'s (`text-2xl font-normal
tracking-tight text-heading`). No description under the title
  (`description` is deprecated and ignored).
- Back: `back={{ href, label }}` (or `onClick`) — a square outline
  `icon-sm` ← with a "Kembali ke …" tooltip. Use it on detail pages that
  have one obvious parent (process editor, employee KPI, library folder).
- Actions: right of the title, `gap-2`, the main action last
  (`Button` default variant), icon buttons with a `Tooltip`.
- Don't add bottom padding to the page root; the layout gives `pb-6`
  (and room for the tab bar on phones).
- Same padding on every page: the first thing (title, tabs or toolbar)
  sits 48px below the sheet's top (sheet `md:pt-6` + `pt-6`), the sides
  are the gutter, and the last block ends 24px above the sheet's bottom
  (the layout's `pb-6` only). No `pb-*` on the last block either (a
  `pb-4` wrapper around the list or grid makes it 40px).
- A page without a `PageHeader` that fills the sheet (calendar:
  `CALENDAR_HEIGHT`) starts with `pt-6` too, so its toolbar sits where a
  title would.

**Gutter and bleed**

- `--page-gutter`: 1.25rem on phones (never under `--bleed` 0.75rem),
  2.5rem from `md`, 4rem from `xl`, each minus the scrollbar width
  (`--sbw`), set once on `SidebarInset`. Use `gutter-x`; never hard-code
  `px-10` on a page.
- Bands that overhang (stat strip, tab line) use `bleed gutter-x`:
  pulled `--bleed` past the content edge, content still on the gutter.
- Lists, tables, grids, boards, the search field and buttons all sit on
  the content edge, so a view toggle never changes the width. Lists and
  tables keep their 12px room inside the rows (`list-bleed`, built into
  `GroupedList` and `ui/table.tsx`); row text sits 12px in from the title.

**Scroll panes** (`globals.css`)

- Anything that scrolls vertically is `scroll-pane` (keeps the scrollbar's
  room on both sides, so left and right spacing match). With its own side
  padding: `scroll-pane pane-px-5` (not `px-5`). Inside a padded box:
  `scroll-pane scroll-pane-bleed-1`. A header that must line up with it:
  `scroll-gutter-match`. Short menus and pickers: `no-scrollbar`.

**Sections**

- `SectionTitle` (`pt-6 pb-3`, `text-sm`, count in tertiary): a heading
  between parts of one page. `TableSection`: a title over a table
  (`text-sm font-medium`, `pb-1`). `HomeCard` / `Panel`: a block on a card
  surface (see components.md).
- `StatStrip`: label (`text-sm` muted) over value (`text-stat font-normal
tabular-nums`, `RollingValue`), side by side `gap-x-10`, `py-4`, no
  rule below (the table header band separates it), full bleed. Directly under the header or tabs. `aside`
  puts controls on the right (the main action, "process all"); `orEmpty`
  shows the dashed mark for a missing value; a value may be a `Skeleton`.
- `StatTiles`: the same numbers on cards (`surfaceClassName`), 2–4 columns;
  `variant="strip"` is one card split into cells.

**Minimal screens** (no app around: `/login`, `/b/…` brief, `/p/…` PIN,
`/r/…` client report, `/desktop/connect`, update password, 404 / error)

- `MinimalScreen` (darker field + animated `BrandBackdrop` + a
  `ScreenControls` pill top right, theme toggle by default) holding one
  `MinimalCard` (`max-w-lg rounded-[24px] px-6 py-12 sm:px-10 sm:py-14`,
  frosted via `GlassLayer`, content centred in `max-w-sm`).
- Inside: `AppIcon` with `screenLogoClass`, an `h1` with
  `screenTitleClass`, text with `screenTextClass`, controls with
  `glassControlClass`. Not for anything signed-in.

**Fullscreen routes** (`src/app/(fullscreen)`: no sidebar, no top bar)

- Minimal screens, the client portal (`/p/…`, its own `PortalShell` on
  the same `PageSheet`), print pages, the desktop-app helpers
  (`/desktop`, `/auth/desktop*`, `/menubar`), the 360 review form, dev
  labs (`/shadow-lab`). A new full-window flow goes here, not in `(main)`.

**Desktop app (Kretya Flow)**

- The shell comes from the `krty_shell` cookie (`mac` | `windows`), read
  in the layout so the first paint is right.
- Mac (`useMacChrome()`): no title bar; the top bar is 52px and holds the
  traffic lights and the sidebar toggle (so `SiteHeader` hides its
  toggle); chrome is see-through over the window blur; the page sheet
  radius is 10px, 6px from the window edge; right sheets and the side
  panel sit 14px from the edges (`DESKTOP_CSS` in the layout). ⌘[ / ⌘]
  go back / forward.
- Windows: keeps the web layout and title bar; `useDesktopShell()` is
  true for things both apps share (theme sync, "open in browser").
- Branch on these hooks only for chrome; pages look the same everywhere.

**Responsive**

| Breakpoint    | What changes                                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| < 640 (`sm`)  | Dialogs become bottom sheets; dialog widths apply from `sm:`                                                                            |
| < 768 (`md`)  | No sidebar, no breadcrumb row; `MobileNav` tab bar; page sheet rounded on top only (`max-md:rounded-t-3xl max-md:pt-2`); gutter 1.25rem |
| ≥ 1024 (`lg`) | Docked side panels (My notes) leave the flow and float right                                                                            |
| ≥ 1280 (`xl`) | Gutter 4rem                                                                                                                             |

- Phones get a reduced app: the tab bar (today, my tasks, calendar,
  leave) and pages reached from links. Mark desktop-only entries
  `max-md:hidden` (e.g. `HomeAction desktopOnly`).
- Responsive layout in CSS (`max-md:` / `md:`); `useIsMobile()` only when
  the component tree itself must change (sheet side).

**Print**

- A print page is a `(fullscreen)` route: screen = grey field + toolbar +
  the paper (`bg-white shadow-(--elev-3)`); `@media print` hides the
  toolbar, removes shadow and background, `@page { size: A4; margin: 0 }`,
  `print-color-adjust: exact`, `break-inside: avoid` on blocks. It calls
  `window.print()` once its assets (QR) are loaded.

## Don't

- A page heading made by hand (`<h1 className="text-2xl …">`) or a second
  large heading; a description line under the title.
- `px-*` / `mx-auto max-w-*` on a page instead of the gutter.
- `overflow-y-auto` + `px-5` on a scrolling pane (spacing goes uneven);
  `scroll-pane pane-px-5`.
- Copying the stat-strip markup (`stat-strip bleed gutter-x …`) into a
  page; use `StatStrip`. Copying the page sheet's classes; use `PageSheet`.
- A sticky page header with `backdrop-blur` (the sheet scrolls under it
  and the blur repaints every frame).
- Checking `navigator.userAgent` for the desktop app; use the hooks.
- `pb-*` on the page root or its last block (to clear the tab bar, or as
  bottom room); the layout does it.

## Good examples

- Header + stats + search + list: `src/page-slices/teams/ui/TeamsPage.tsx` (header part)
- Header with view toggle and main action: `src/page-slices/projects/ui/workspace/ProjectInvoices.tsx`
- Back button: `src/page-slices/performance/ui/kpi/EmployeeKpiPage.tsx`
- Breadcrumb steps + back: `src/page-slices/processes/ui/ProcessEditorPage.tsx`
- Minimal screen: `src/app/(fullscreen)/login/page.tsx`
- Print: `src/page-slices/projects/ui/invoice/InvoicePrintPage.tsx`

## Example

```tsx
<div className="flex flex-col">
  <PageHeader
    className="pt-6 pb-4"
    title={t("invoice")}
    back={{ href: "/projects", label: t("projects") }}
    actions={
      <Button>
        <RiAddLine data-icon="inline-start" />
        {t("new")}
      </Button>
    }
  />
  <StatStrip
    items={[
      { key: "open", label: t("open"), value: 4 },
      { key: "paid", label: t("paid"), value: "Rp 48 jt" },
    ]}
  />
  <SectionTitle extra={rows.length}>{t("thisMonth")}</SectionTitle>
  <GroupedList>…</GroupedList>
</div>
```

## Migration notes

Done 2026-11-05 (local): `PageSheet` (`src/components/page-sheet.tsx`:
shadow layer, gutter / bleed / `--sbw` variables, radius, Mac 10px
corner, plus `pageSheetContentClassName`) used by `(main)/layout.tsx` and
`PortalShell.tsx` (each keeps its own bottom room for its tab bar; the
portal keeps `max-md:shadow-raised`, the app `max-md:pt-2`);
`MAC_SHEET_RADIUS` moved there. `StatStrip` got `aside` and `orEmpty`
(item `key` optional, the value is a `div` so a `Skeleton` fits);
`StatBand` deleted and its users (ProjectAssessment, ReviewMonitoring,
OneOnOne ×2, TeamKpiList) and the MembersAccessSettings copy are
`StatStrip` (Members' numbers now roll like every strip). `HomeGreeting`
renders `PageHeader` (`pt-0 pb-0`, `HomeColumn` spaces it). PageHeader's
`description` prop removed. TableSection comment says it is DataTable's
own header. `(fullscreen)/layout.tsx` comment in English.

Left: `EmployeeLeavePage` balances (a `dl` with a "rules" button inside
the label and a 3-column phone grid; not the StatStrip markup).
FinancePage's `gap-4` + `PageHeader pb-0` gives the same 16px as `pb-4`
(left as is). Phone breakpoint (640 vs 768) still needs a decision.
The older list below is kept for reference.

- The stat-strip markup is copied instead of `StatStrip`:
  `src/page-slices/teams/ui/TeamsPage.tsx:160`,
  `src/page-slices/leave/ui/StakeholderLeavePage.tsx:1132`,
  `src/page-slices/settings/ui/MembersAccessSettings.tsx:487`, and
  `StatBand` in `src/page-slices/performance/ui/list.tsx:112` (used by
  `OneOnOne.tsx`, `ReviewMonitoring.tsx` and cross-slice by
  `projects/ui/workspace/ProjectAssessment.tsx`) → add `aside` and
  `orEmpty` to `StatStrip`, replace all four, delete `StatBand`.
- `src/app/(main)/dashboard/components/home-card.tsx:20` `HomeGreeting`
  repeats `PageHeader`'s `h1` classes → `PageHeader title`.
- `src/page-slices/finance/ui/FinancePage.tsx:149-151` — root `gap-4 pb-6`
  and `PageHeader className="pt-6"` (no `pb-4`) → `flex flex-col` +
  `pt-6 pb-4` like every page.
- `src/page-slices/ui-docs/ui/UiDocsPage.tsx:28` — `TabNavigation
className="mb-8"` (other pages put content right under the tabs) → fine
  for the docs page; don't copy.
- `src/app/(fullscreen)/performance-review/new/ClientPage.tsx:67` — own
  sticky header with `backdrop-blur`, own `mx-auto max-w-2xl` column and an
  `h1 text-lg` → `PageHeader back` in a plain column, or a `MinimalScreen`.
- `src/page-slices/projects/ui/portal/PortalShell.tsx:219-263` copies the
  page sheet (`SidebarInset` gutter variables, shadow layer, content
  wrapper) with small drifts (`max-md:rounded-t-[28px]` vs
  `rounded-t-3xl`, `pb-6` vs layout, `max-md:pb-[calc(8rem+…)]` vs
  `6.5rem`) → one `pageSheetClassName` / `PageSheet` shared by both shells.
- Two "phone" breakpoints: CSS `max-sm` (640) for dialogs vs `md` (768)
  for navigation and `useIsMobile()` → document 768 as "phone" and move
  the dialog sheet to `max-md`, or keep 640 and say so in overlay.md
  (needs a decision).
- `src/components/table-section.tsx` — only used inside
  `components/data-table/data-table.tsx`; its `@example` shows `<Table>`
  and a `description` nobody passes → keep it DataTable-internal (or fold
  into `SectionTitle`), fix the comment.
- `PageHeader` `description` prop is deprecated and ignored
  (`page-header.tsx:29`) and no caller passes it → remove it from the type.
- `src/app/(fullscreen)/layout.tsx:6` — comment in Indonesian ("Layout
  tanpa sidebar…") → English like the rest of the code.
