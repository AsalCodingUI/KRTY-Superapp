# Typography

Every piece of text in the app: page and section titles, card and dialog
titles, body, secondary and meta lines, labels, numbers, code and written
documents. Live examples: **/ui** → Typography.

## Use

| Need                            | Use                                                        | File                                                             |
| ------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- |
| Page title (one per page)       | `PageHeader title`                                         | `src/components/page-header.tsx`                                 |
| Quiet section heading in a page | `SectionTitle` (with `extra` count)                        | `src/components/section-title.tsx`                               |
| Bordered block with a title     | `Panel title meta` / `HomeCard title`                      | `src/components/panel.tsx`, `dashboard/components/home-card.tsx` |
| Dialog / sheet / alert title    | `DialogTitle`, `SheetTitle`, `AlertDialogTitle`            | `src/components/ui/dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx`  |
| Line under a title              | `DialogDescription`, `CardDescription`, `FieldDescription` | `src/components/ui/*`                                            |
| Headline numbers                | `StatStrip` / `StatTiles` (+ `RollingValue`)               | `src/components/stat-strip.tsx`, `stat-tiles.tsx`                |
| Missing number                  | `EmptyValue` / `orEmpty()`                                 | `src/components/empty-value.tsx`                                 |
| Form label                      | `Label`, `FieldLabel`                                      | `src/components/ui/label.tsx`, `field.tsx`                       |
| Written content (read)          | `Markdown`                                                 | `src/components/markdown.tsx`                                    |
| Written content (edit)          | `DOC_PROSE` (doc editor)                                   | `src/page-slices/policies/ui/doc-editor.tsx`                     |
| Brief / public card heading     | `screenTitleClass`, `screenTextClass`                      | `src/components/minimal-screen.tsx`                              |
| Keyboard shortcut               | `Kbd`                                                      | `src/components/ui/kbd.tsx`                                      |

## Fonts

- **Geist** (sans) and **Geist Mono**, loaded once with `next/font/google`
  in `src/app/layout.tsx` (`subsets: ["latin"]`, `display: "swap"`), as
  the CSS variables `--font-geist-sans` and `--font-mono` on `<html>`.
- `--font-sans` (globals.css `@theme inline`) = Geist, then the system
  stack, then the emoji fonts. `font-heading` / `font-display` /
  `font-body` / `font-label` (tailwind.config.ts) are all the same Geist;
  they exist for old code. Write no `font-*` family class on normal UI.
- `font-mono` only for code, IDs, hashes, file names in docs, CSS values.
- Don't add a font. A new family is a new network request on every page.
- `body`: `text-sm text-foreground font-normal`, antialiased
  (`-webkit-font-smoothing`). Text that sets nothing is already body text.

## Scale (by role)

Tailwind's line-heights come with each size. px = font size / line height.

| Role                                          | Classes                                                                      | px         |
| --------------------------------------------- | ---------------------------------------------------------------------------- | ---------- |
| Document title (policy, What's New)           | `text-heading text-4xl leading-tight font-medium tracking-tight`             | 36 / 45    |
| KPI hero number                               | `text-heading text-5xl leading-none font-normal tracking-tight tabular-nums` | 48 / 48    |
| Page title (`PageHeader`)                     | `text-heading text-2xl font-normal tracking-tight` + `truncate`              | 24 / 32    |
| Card screen title (brief, public)             | `text-heading text-2xl font-medium tracking-tight text-balance`              | 24 / 32    |
| Stat value (`StatStrip`, `StatTiles`)         | `text-xl font-normal tracking-tight tabular-nums`                            | 20 / 28    |
| Heading in a document (md `#`)                | `text-heading text-xl font-medium tracking-tight`                            | 20 / 28    |
| Empty state / sub-section title               | `text-lg font-medium tracking-tight`                                         | 18 / 28    |
| Dialog / sheet title                          | `text-heading text-[15px] leading-snug font-medium`                          | 15 / 20.6  |
| Card title (`HomeCard`)                       | `text-heading text-[15px] font-normal`                                       | 15 / 21.4  |
| Prose (Markdown, editor)                      | `text-foreground/90 text-[15px] leading-7`                                   | 15 / 28    |
| Panel title, section title                    | `text-sm font-medium` (Panel) / `text-sm` (SectionTitle)                     | 14 / 20    |
| Body, rows, buttons, inputs (desktop)         | `text-sm`                                                                    | 14 / 20    |
| Secondary / description                       | `text-muted-foreground text-sm`                                              | 14 / 20    |
| Meta / caption (under a row title)            | `text-tertiary-foreground text-[13px]`                                       | 13 / ~18.6 |
| Column labels, settings group labels          | `text-muted-foreground text-[13px]` (`font-medium` for settings groups)      | 13 / ~18.6 |
| Small: badge, tooltip, kbd, shortcuts         | `text-xs`                                                                    | 12 / 16    |
| Counter in a pill, initials in size-6/7 tiles | `text-[11px] font-medium tabular-nums` (`leading-4` in pills)                | 11 / 16    |

That is 11 / 12 / 13 / 14 / 15 / 18 / 20 / 24 and the display sizes
(36, 48). Nothing between them, nothing under 11px for text.

## Tokens (use these)

Defined in `src/app/globals.css` (`@theme`, `--text-*`). Each class sets
**size + line height + tracking**; weight stays a separate class
(`font-normal` 450 / `font-medium` 500). Live and measured on /ui →
Typography.

| Class             | Size / leading | Tracking | Role                                               |
| ----------------- | -------------- | -------- | -------------------------------------------------- |
| `text-micro`      | 11 / 16        | +0.01em  | pills, kbd, tiny counts                            |
| `text-caption`    | 12 / 16        | +0.005em | badges, tooltips, xs buttons (≈ `text-xs`)         |
| `text-meta`       | 13 / 18        | 0        | descriptions, row meta, chips, column labels       |
| `text-body`       | 14 / 20        | 0        | body, rows, fields, buttons (= `text-sm`)          |
| `text-title`      | 15 / 22        | −0.005em | Dialog / Sheet / Card titles, HomeCard             |
| `text-section`    | 18 / 26        | −0.01em  | section titles, editor-dialog titles, empty states |
| `text-stat`       | 20 / 26        | −0.02em  | StatStrip / StatTiles values (+ `tabular-nums`)    |
| `text-page-title` | 24 / 30        | −0.02em  | PageHeader h1                                      |
| `text-kpi`        | 28 / 34        | −0.025em | big KPI numbers (+ `tabular-nums`)                 |

- Tracking is graded by size and lives in the token: don't add
  `tracking-*` on top (except `tracking-[0.06em]` on unavoidable caps).
- Don't write `text-[13px]`, `text-[15px]`, `text-[11px]` any more: they
  are `text-meta`, `text-title`, `text-micro`.
- `text-sm` / `text-xs` stay valid (same metrics as body / caption).
- **A new token must also be registered in `src/lib/utils.ts`** (the
  `font-size` group of `createCn`). Unregistered, the class merger reads
  `text-<name>` as a text color, so `cn("text-white", "text-micro")`
  drops the white. Import `cn` from `@/lib/utils`, never from `"cn"`.

## Rules

**Sizes**

- Pick the role, use its classes. No other sizes: no `text-[12px]` (it is
  `text-xs`), no `text-[14px]` (`text-sm`), no `text-[13.5px]`,
  `text-[11.5px]`, `text-[0.8rem]`.
- `text-base` (16px) is only for: inputs and textareas on phones
  (`text-base md:text-sm`, so iOS doesn't zoom), and the `##` heading in
  documents. Not for card or dialog titles (those are 15px).
- One `h1` per page and it is `PageHeader`. Inner titles are `h2` / `h3`.
- Avatar initials follow the avatar size (`UserAvatar`, `ProjectAvatar`
  own it); the 9–10px initials in tiny avatars are the only text under
  11px, and they come from the component, not the call site.
- Print and file previews (`InvoiceDocument`, `office-view.tsx`,
  `FilePreview`) use their own fixed px sizes; they are pictures of paper,
  not app UI.

**Weights**

- Two weights: `font-normal` (**450**, set in globals.css
  `--font-weight-normal`) and `font-medium` (500). No `font-light`,
  `font-semibold`, `font-bold`. Markdown bold renders as `font-medium`.
- Big numbers and the page title are `font-normal` (calm, Mercury-like);
  titles inside content (dialogs, docs, empty states, panels) are
  `font-medium`.
- Labels, buttons, badges, tabs: `font-medium` (already in the component).

**Tracking and leading**

- `tracking-tight` on 18px and up (titles, stats). Never on `text-sm` or
  smaller. `tracking-widest` only for shortcut hints in menus (the
  component has it).
- Leading comes with the size. Change it only for:
  `leading-none` (big numbers stacked under a label, `Label`),
  `leading-snug` (titles that may wrap: `DialogTitle`),
  `leading-tight` (display titles), `leading-7` (prose),
  `leading-relaxed` (a paragraph on a public screen), `leading-4` (11px
  pills). No `leading-[Npx]` in app UI.
- `text-[13px]` has no line-height of its own: it keeps the parent's ratio
  (1.43 under `text-sm` ≈ 18.6px). That is intended; don't add
  `leading-*` to fix one spot.

**Color by role** (tokens in [color.md](color.md))

| Role                        | Class                                                                   |
| --------------------------- | ----------------------------------------------------------------------- |
| Titles                      | `text-heading`                                                          |
| Body, values                | `text-foreground` (inherited, rarely needed)                            |
| Secondary, descriptions     | `text-muted-foreground`                                                 |
| Meta, counts, quiet hints   | `text-tertiary-foreground`                                              |
| Placeholder                 | `placeholder:text-muted-foreground` (fields)                            |
| Link                        | `text-primary` + `underline` (dotted, global)                           |
| Error, destructive          | `text-destructive`                                                      |
| Success text / icon         | `text-success-ink`                                                      |
| Warning text                | `text-amber-11` (icons and dots: `text-warning`)                        |
| On the chrome (sidebar/top) | inside `.on-chrome`, `text-muted-foreground` turns into translucent ink |

- `text-heading` and `text-foreground` are the same ink today; use
  `text-heading` on titles anyway so they can change in one place.
- Quieter than muted is `text-tertiary-foreground`, not
  `text-muted-foreground/50`. Disabled is `opacity-50` from the component.
- Links: the global base style makes underlines dotted with
  `underline-offset: 0.25em`. Don't add `underline-offset-*` or
  `decoration-dotted` per link.
- Selection: `selection:bg-primary/20 selection:text-primary` on `<body>`;
  don't restyle selection locally.

**Numbers**

- Every number that can change or sits in a column: `tabular-nums`
  (amounts, counts, dates, durations, scores, timers). Big stats roll
  with `RollingValue`; a missing value is `EmptyValue`, never "-" or "0".
- Currency and thousands follow the user's locale (`Intl.NumberFormat`
  with the active locale; Indonesian uses `.` for thousands).

**Long text**

- One-line text in a flex/grid row: `min-w-0` on the cell + `truncate`.
  Titles in headers truncate (`PageHeader`, `Panel`, `HomeCard` do).
- Two-line previews: `line-clamp-2`. No `line-clamp-[N]` beyond 3 in UI.
- Headings that can wrap (screens, briefs, empty states):
  `text-balance`. Paragraphs: `text-pretty` if a lone last word looks bad.
- User content (URLs, file names, IDs): `break-words`, or
  `[overflow-wrap:anywhere]` for mentions/chips.
- Buttons, badges and tabs never wrap (`whitespace-nowrap` is built in).

**Indonesian strings (i18n)**

- Indonesian copy runs ~20–35% longer than English ("Simpan perubahan" vs
  "Save"). Don't give text a fixed width; let it truncate or wrap.
- Check every new label in both locales (`useT`), the longest one in the
  narrowest layout (phone, collapsed sidebar).
- `<html lang>` is the active locale; don't hard-code `lang` elsewhere.
- No `uppercase` on translated text (Indonesian reads oddly in caps, and
  `uppercase` breaks acronyms); use sentence case in the copy itself.

**Light**

- Fonts are self-hosted by next/font with `display: swap`: no layout shift
  from a second font, no extra request. Keep it to the two families.
- Don't animate `font-size` or `font-weight`; animate `transform` /
  `opacity` (reduced motion keeps fades only, see globals.css).

## Don't

- `text-[12px]`, `text-[14px]`, `text-[13.5px]`, `text-[0.8rem]`: use the
  scale step.
- `text-base` or `text-xl` on a `DialogTitle` / card title.
- `font-semibold` / `font-bold` / `font-light`.
- `tracking-tight` on body text, `tracking-wide uppercase` labels.
- `text-muted-foreground/60` for a quieter gray (use tertiary).
- `text-gray-500`, `text-neutral-700` or any palette gray for text.
- Numbers without `tabular-nums` in a list or stat.
- A copied `<h2 className="text-foreground pt-6 pb-3 text-sm">`: import
  `SectionTitle`.

## Not app UI (keep their own type)

Printed invoice (`InvoiceDocument`, fixed px for A4), file thumbnails
(`office-view.tsx`, `FilePreview`, 7px scaled previews), OG images
(`src/shared/og`), emails (`notification-email-html.ts`), the status page
code (`status-page.tsx`, 7–9rem).

## Good examples

- Page title: `src/page-slices/teams/ui/TeamsPage.tsx` (`PageHeader`)
- Stat values: `src/page-slices/finance/ui/OverviewTab.tsx` (`StatTiles`)
- Card titles: `src/app/(main)/dashboard/components/home-card.tsx`
- Row title + meta: `src/page-slices/projects/ui/ProjectList.tsx`
- Dialog title/description: `src/components/ui/dialog.tsx`
- Reading type: `src/components/markdown.tsx`

## Example

```tsx
<PageHeader title="Cuti & Kehadiran" />
<StatStrip
  items={[{ key: "left", label: "Sisa cuti", value: "8 hari" }]}
/>
<SectionTitle extra={3}>Pengajuan terbaru</SectionTitle>
<div className="flex min-w-0 flex-col">
  <span className="truncate">Cuti tahunan</span>
  <span className="text-tertiary-foreground truncate text-[13px] tabular-nums">
    12–14 Nov · 3 hari
  </span>
</div>
```

## Migration notes

Done 2026-11-05 (local): the role tokens above; `text-[13px]` (250),
`text-[11px]` (35), `text-[15px]` (29) and the off-scale sizes
(`12px`, `14px`, `11.5px`, `13.5px`, `0.8rem`) moved to tokens; one KPI
size (`text-kpi`) for the `1.75rem` / `2rem` / `3xl` numbers; Dialog,
Sheet, Card and calendar titles on `text-title`, editor dialogs on
`text-section`; stat values on `text-stat` (and two inline StatStrip
copies replaced by `StatStrip`); `font-light` removed; translated text
no longer `uppercase`; `formatters.currency` follows the page language.
The older list below is kept for what's left.

Audit (src, excluding `ui-docs`): `text-sm` 492, `text-xs` 262,
`text-[13px]` 251, `text-[11px]` 36, `text-[15px]` 35, `text-base` 29,
`text-xl` 24, `text-lg` 19, `text-[10px]` 18, `text-[9px]` 10,
`text-2xl` 9, `text-[12px]` 9, `text-[14px]` 9, `text-[16px]` 6;
`font-medium` 336, `font-normal` 72, `font-bold` 2 (tests), `font-light` 1;
`tabular-nums` 262, `truncate` 325, `text-balance` 14.

**Off-scale sizes**

- `text-[12px]` → `text-xs`: `page-slices/santuy/ui/SantuyPage.tsx:607,630,635`,
  `finance/ui/SubscriptionsTab.tsx:382`, `finance/ui/OverviewTab.tsx:285`.
- `text-[14px]` → `text-sm`: `policies/ui/ai-assist.tsx:882`.
- `text-[11.5px]` → `text-[11px]` or `text-xs`: `components/sidebar-notices.tsx:100`.
- `text-[13.5px]` → `text-sm` (or `text-[13px]`): `policies/ui/doc-editor.tsx:81`
  (`COMPACT_PROSE`), `projects/ui/my-notes/MyNotesPage.tsx:578`.
- `text-[0.8rem]` → `text-[13px]`: `components/ui/calendar.tsx:113,122`.
- `text-[1.75rem]` (28px, 3 KPI cards) is a missing step: make it a theme
  size (e.g. `--text-kpi`) or move to `text-3xl`:
  `dashboard/components/home-card.tsx:195`, `HomeKpiCard.tsx:71`, `TeamKpiCard.tsx:79`.
- `text-3xl` used once: `widgets/menubar/ui/MenubarPopover.tsx:672` → the KPI step.
- `text-[2rem]`: `performance/ui/kpi/MyKpiView.tsx:255` → KPI step.
- `text-[8px]`/`text-[9px]`/`text-[10px]` passed to avatar fallbacks at call
  sites (e.g. `projects/ui/workspace/task-menu.tsx:90`, `TaskBoard.tsx:694`,
  `TaskDialog.tsx:664`, `ProjectKanban.tsx:115`, `teams/Columns.tsx:96`,
  `leave/ui/components/AdminColumns.tsx:105`) → let `UserAvatar` sizes own
  the initials size. `month-view.tsx:179` (9px text) → `text-[11px]`.

**Titles**

- `CardTitle` is `text-base font-medium` (`components/ui/card.tsx:40`) →
  `text-[15px]` like DialogTitle/HomeCard.
- Calendar dialogs set `text-base` on their title:
  `widgets/event-calendar/ui/event-dialog.tsx:522`, `month-view.tsx:296`,
  `dialog-variants/BaseReadOnlyDialog.tsx:113`, `SharingSantuyDialog.tsx:95,194`,
  `MeetingDialog.tsx:97`, `HolidayDialog.tsx:58`; also
  `entities/leave/ui/LeaveCard.tsx:55`, `review/ReviewMonitoring.tsx:336`,
  `widgets/settings/ui/SettingsDialog.tsx:131` → `text-[15px]` title role.
- DialogTitle overridden to `text-xl font-normal`:
  `contracts/ui/ContractFormDialog.tsx:200`, `projects/ui/workspace/ProjectDocuments.tsx:524`,
  `projects/ui/invoice/InvoiceEditorDialog.tsx:800`, `briefs/ui/BriefDialog.tsx:177`
  (and `text-lg` in `portal/PortalReportDialog.tsx:58`). Either drop the
  override, or add a `size="lg"` (full-screen editor) variant to `DialogTitle`.
- `<h1 className="text-lg font-medium">` in `(fullscreen)/performance-review/new/ClientPage.tsx:83`
  → `PageHeader` or the card screen title.
- Inline copies of `SectionTitle`: `performance/ui/meeting/OneOnOne.tsx:738,834`,
  `performance/ui/kpi/KpiSections.tsx:30` → `SectionTitle`.

**Numbers**

- Inline copies of `StatStrip` (same markup, own classes):
  `teams/ui/TeamsPage.tsx:160-166`, `performance/ui/list.tsx:125`,
  `leave/ui/StakeholderLeavePage.tsx:1136`, `leave/ui/EmployeeLeavePage.tsx:274,282,310,322`,
  `settings/ui/MembersAccessSettings.tsx:513` → `StatStrip` (StatTiles uses
  `text-heading`, StatStrip `text-foreground`: settle on `text-heading`).
- Stat values off the stat role: `entities/leave/ui/LeaveBalance.tsx:52`
  (`text-2xl font-medium`, plus a no-op `dark:text-foreground`),
  `dashboard/components/DashboardProgressBarCard.tsx:42` and
  `DashboardCategoryBarCard.tsx:44` (`text-lg font-medium`),
  `performance/ui/kpi/ProjectScoringView.tsx:507` (`text-2xl`) →
  `text-xl font-normal tracking-tight tabular-nums`.
- `formatters.currency` in `shared/lib/utils/cn.ts:65` is hard-coded to
  `en-US`; numbers on screen should use the active locale.

**Weights, tracking, color**

- `font-light` in `projects/ui/portal/PortalShell.tsx:137` (a separator,
  also `text-muted-foreground/50`) → `text-tertiary-foreground font-normal`.
- `uppercase` on translated text: `performance/ui/meeting/MyOneOnOne.tsx:121`,
  `components/language-switcher.tsx:40` (locale code, OK to keep).
- `text-muted-foreground/40…/80` as a "quieter gray" (≈30 places, e.g.
  `entities/user/ui/UserCard.tsx:55`, `UserProfile.tsx:71`,
  `entities/leave/ui/LeaveCard.tsx:62`, `components/tab-navigation.tsx:125`,
  `segmented-control.tsx:89`, `widgets/event-calendar/ui/mini-calendar.tsx:73`,
  `month-view.tsx:155`) → `text-tertiary-foreground`.
- Placeholders in title inputs use `placeholder:text-muted-foreground/60`
  or `/50` (`whats-new/ui/WhatsNewEditor.tsx:210`, `workspace/NoteDialog.tsx:207`,
  `workspace/ReportDialog.tsx:288`, `policies/ui/PolicyEditor.tsx:594,623`,
  `policies/ui/embed.tsx:198`) while fields use plain `muted-foreground`
  → pick one (`placeholder:text-tertiary-foreground` for both is the likely target).
- Warning text in amber-9 (`text-warning`, low contrast on white, ~25
  text uses, e.g. `attendance/components/AttendanceHistoryList.tsx:357`,
  `performance/ui/kpi/ProjectScoringView.tsx:317,616,803`,
  `MyKpiView.tsx:423`, `widgets/notifications/ui/NotificationsPanel.tsx:442`,
  `event-calendar/ui/event-tone.ts:49,54`) → `text-amber-11` (or a new
  `--warning-ink` token like `--success-ink`). Icons can stay `text-warning`.
- `text-amber-600 dark:text-amber-400`: `policies/ui/ai-assist.tsx:893` → `text-amber-11`.
- Link underline offsets set per link (`underline-offset-2/3/4`, 23 uses,
  e.g. `components/markdown.tsx:81`) override the global 0.25em; DOC_PROSE
  repeats `decoration-dotted underline-offset-[0.25em]` (`doc-editor.tsx:62`)
  → drop them, the base style covers it.

**Prose**

- Markdown and `DOC_PROSE` match (15px / leading-7, h1 xl, h2 base, h3 sm);
  keep them in sync. `screenTextClass` (`minimal-screen.tsx:106`) and
  `ReviewResult.tsx:223,244,314` use 15px with `leading-relaxed`: fine, it
  is the reading size.
