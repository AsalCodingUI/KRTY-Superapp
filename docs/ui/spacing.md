# Spacing

The 4px grid, the page gutter and bleed, section spacing on pages, padding
in cards / dialogs / sheets, scroll panes, gaps inside rows and controls,
touch targets, breakpoints and safe areas. Live examples: **/ui** → Spacing.

## Use

| Need                                   | Use                                                           | File                                                         |
| -------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| Side padding that matches the page     | `gutter-x` (= `--page-gutter`)                                | `src/app/globals.css`                                        |
| A strip / separator wider than text    | `bleed` (+ `gutter-x` inside)                                 | `globals.css`; built into `StatStrip`, `TabNavigation bleed` |
| A list / table (room inside the rows)  | `list-bleed` (`list-overhang` on a padded box)                | `globals.css`; built into `GroupedList`, `ui/table.tsx`      |
| A scrolling pane with side padding     | `scroll-pane pane-px-<n>`                                     | `globals.css`                                                |
| A scrolling pane inside a padded box   | `scroll-pane scroll-pane-bleed-<n>`                           | `globals.css`                                                |
| A scrolling box with a visible border  | `scroll-pane-framed` (block, not flex / grid)                 | `globals.css`                                                |
| A header/footer aligned to a bare pane | `scroll-gutter-match`                                         | `globals.css`                                                |
| Page title block                       | `PageHeader` (32px row, the sheet's pt-3 above, pb-3 under)  | `src/components/page-header.tsx`                             |
| Dialog padding                         | `DialogHeader` / body / `DialogFooter` (all `p-5`)            | `src/components/ui/dialog-sections.tsx`                      |
| Sheet padding                          | `SheetHeader` / `scroll-pane pane-px-5` / `SheetFooter`       | `src/components/ui/sheet.tsx`                                |
| Card                                   | `HomeCard` (`p-5 gap-4`) or `Panel` (`px-4` header)           | `dashboard/components/home-card.tsx`, `components/panel.tsx` |
| Stats band                             | `stat-strip` / `stat-tile`                                    | `globals.css`                                                |
| Form fields                            | `flex flex-col gap-2` label → control; `gap-4` between fields | dialogs, `ui/field.tsx`                                      |

## The grid

Tailwind's `--spacing` is 0.25rem (4px). Use these steps:

| Step | px  | Typical use                                                      |
| ---- | --- | ---------------------------------------------------------------- |
| 0.5  | 2   | Header → first row offset, tight label stacks (`gap-0.5`)        |
| 1    | 4   | Between list rows (built in), icon buttons in a card header      |
| 1.5  | 6   | Icon ↔ text inside a button, ListChip, chip rows                 |
| 2    | 8   | Default gap: button groups, actions, label → control, menu items |
| 3    | 12  | Leading icon/avatar ↔ text in a row, card header items           |
| 4    | 16  | Between fields, between blocks on a page, column gap (`gap-x-4`) |
| 5    | 20  | Dialog / card / sheet padding (`p-5`, `pane-px-5`)               |
| 6    | 24  | Page top (`pt-6`), big field groups (`FieldGroup gap-6`)         |
| 8    | 32  | Between page sections that need air (UI docs tab groups)         |
| 10   | 40  | `stat-strip` column gap, desktop gutter                          |

Half steps (`2.5`, `3.5`) only inside shared components that need them
(button padding, sidebar items, `Item`). Pages stay on whole steps.

## Page gutter and bleed

Set once on the page sheet (`SidebarInset` in `src/app/(main)/layout.tsx`):

| Width     | `--page-gutter`                            | Rendered (styled scrollbar, `--sbw` 12px) |
| --------- | ------------------------------------------ | ----------------------------------------- |
| phone     | `max(var(--bleed), calc(1.25rem - --sbw))` | 20px (no scrollbar room on phones)        |
| md (768)+ | `calc(1.5rem - --sbw)`                     | 24px from the sheet edge                  |

`--bleed: 0.75rem` (12px). The scrollbar room (`--sbw`) is subtracted
because the sheet is a `scroll-pane` that keeps that room on both sides.

- The content wrapper is `gutter-x`; page content never sets its own
  side padding.
- `bleed` pulls an element out by `--bleed` (not the whole gutter) and
  sets the gutter inside it to `--bleed`, so its `gutter-x` text still
  lines up with the page title. The stats strip and the tab line use it.
- Lists and tables (`GroupedList`, `ui/table.tsx`) use `list-bleed`: on
  the page they reach `--bleed` (12px) past the content edge on each side,
  so the rows' text lines up with the page title (and the tabs) above;
  the header fill and the hover highlight keep that 12px as room.
  Kanban scrollers are plain `overflow-x-auto` on the content edge.
- Inside a padded box (panel, card, dialog, sheet) a list still reaches
  `--bleed` into the box's padding, so its highlight is inset and its
  text lines up with the box's title. Dialogs and sheets get this on
  their own (they render outside the page sheet); a box inside the page
  adds `list-overhang` (`PanelList`, the `MyKpiView` card).
- Inside a card or sheet, re-set both to the box's own padding, e.g.
  `list-overhang [--bleed:0.75rem] [--page-gutter:0.75rem]` (`MyKpiView` card) or
  `[--bleed:0.5rem] [--page-gutter:0.5rem]` (`ProjectKpiSheet`). Outside a
  page both fall back to 1rem.
- An element that bleeds _and_ must be full width needs
  `w-[calc(100%+2*var(--page-gutter,1rem))]` (block elements stretch on
  their own).

## Page section spacing

```
PageHeader          sheet pt-3, pb-3 (12px above the title row, 12px under;
                    the row level with the sidebar panel's "Kantor")
TabNavigation       mb-4
Toolbar / search    mb-4 (or pt-4 pb-3 under a stats strip)
Content             lists, cards…    blocks gap-4
Page bottom         none             layout adds md:pb-6 / phone tab-bar room
```

- Page root: `flex flex-col`; the header's `pb-4` and blocks' `mb-4` /
  `gap-4` give 16px between blocks.
- Dashboard column (`HomeColumn`): `pt-6 pb-10 gap-4`; grids `gap-4`.
- `PageHeader` inside: `gap-x-4 gap-y-3`, title ↔ back button `gap-3`,
  actions `gap-2`.
- `stat-strip`: `gap-x-10 gap-y-4`, tiles `gap-1`, band `py-4`.

## Cards, dialogs, sheets

| Surface            | Padding                                                                                         | Inner gaps                      |
| ------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------- |
| `HomeCard`         | `p-5`; header `min-h-8`                                                                         | `gap-4`, header actions `gap-1` |
| `HomeRow`          | `-mx-2 px-2 py-2 min-h-12` (`min-h-14` with a subtitle); the card's sliding highlight           | `gap-3`                         |
| `Panel`            | header `h-11 px-4`; `PanelList` body `px-4 py-2`, rows reach 8px into it (`list-overhang`)      | `gap-3`                         |
| `HomeFooter`       | `border-t pt-4`                                                                                 |                                 |
| Dialog             | header `px-5 pt-5 pr-12`; body `pane-px-5 pt-4 pb-1`; footer `px-5 pb-5 pt-4`; bare `p-5 gap-5` | body `gap-4`, footer `gap-2`    |
| Sheet (right)      | header `min-h-[3.25rem] px-5 pr-14`; body `scroll-pane pane-px-5`; footer `px-5 py-3`           | `gap-2`                         |
| Drawer             | header `p-4 pb-0`; footer `p-4 pt-0 gap-2`                                                      |                                 |
| Popover            | `p-4 gap-4`; menus `nest-p-2`                                                                   |                                 |
| Minimal glass card | `px-6 py-12 sm:px-10 sm:py-14`, column `gap-6`                                                  |                                 |

The dialog body keeps `pb-1` (and `-m-1 p-1` on nested scrollers) so
focus rings aren't clipped by its overflow.

## Scroll panes and the scrollbar gutter

A desktop scrollbar takes 12px on one side only. `SCROLLBAR_WIDTH_SCRIPT`
(`src/shared/lib/scrollbar-width-script.ts`, runs in `<head>`) measures the
room a `scrollbar-gutter: stable both-edges` box keeps on each side (from
a scrolling probe's content width) and sets `--sbw` on `<html>`: 12px with
the styled desktop scrollbars (Chromium, Safari and the Mac app alike), 0
on overlay scrollbars and phones. Hydration drops `<html>`'s inline style,
so `ThemeColorSync` measures again right after.

- `scroll-pane` = `overflow-y: auto; scrollbar-gutter: stable both-edges`
  (room on both sides, so left = right and nothing shifts). WebKit keeps
  no gutter until a pane overflows and, in a flex / grid scroller, puts
  both sides' room on the right (measured 0 / 24px); there `scroll-pane`
  always shows the (clear) scrollbar track and adds a clear `--sbw` left
  border instead, so every page, tab and dialog measures 24 / 24 in the
  Mac app as in Chrome. The painted page sheet starts its fill at the
  border edge (`background-origin: border-box`).
- A box with its own visible border uses `scroll-pane-framed` (the clear
  border would replace it) and must be a block scroller, with one flex
  wrapper inside if needed.
- A page that fills the sheet (`data-sheet-fill`: calendar, split panes)
  has no scrollbar room, so its `--page-gutter` is the full 24px.
- `pane-px-<n>` = `n × 4px − --sbw`: use it **instead of** `px-<n>` on a
  `scroll-pane`.
- `scroll-pane-bleed-<n>` for a pane inside a box that already has
  padding (`-mx-1 px-1` for focus rings); the box needs ≥ `--sbw` more.
- `scroll-gutter-match` on a header/footer that must align with a bare
  `scroll-pane`.
- Menus and pickers that stay short: `no-scrollbar`.
- Verify by measuring: left and right content offsets must be equal.

## Gaps inside rows and controls

- Button icon ↔ label: built in (`gap-1.5` default/lg, `gap-1` sm/xs);
  mark icons `data-icon="inline-start|inline-end"` so the side padding
  tightens. Don't add `gap` or `mr-*` to buttons.
- Buttons side by side: `gap-2` (PageHeader actions, dialog/sheet footers,
  `ButtonGroup` `gap-2`). Icon buttons in a card header: `gap-1`.
- Row: leading icon/avatar ↔ text `gap-3`; columns `gap-x-4`; chips in a
  row `gap-1.5`; inline icon ↔ text in small labels `gap-1.5` / `gap-2`.
- Title ↔ description stacks: `flex flex-col` (no gap) or `gap-0.5`.
- Form: label → control `flex flex-col gap-2`; field → field `gap-4`
  (dialog body); fieldsets / groups `gap-6` (`FieldGroup`, `FieldSet`).
- Lists: 4px between rows and groups (see `table.md`), built into
  `GroupedList` (`mb-0.5` / `mt-0.5` + the 2px highlight inset).

## Touch targets

- Rows: `min-h-12` (48px), with description `min-h-14`.
- Controls: `h-8` (32px) everywhere; `size="lg"` (40px) for primary page
  actions on phones (`HomeAction`).
- Icon buttons in rows: `icon-sm` (28px) on desktop, `max-md:size-8` on
  phones (`AdminColumns.tsx`, `PortalShell.tsx`).
- Phone tab bar: `h-11` (44px) tabs, `size-14` action.
- Hover-only actions must be visible on touch: `pointer-coarse:opacity-100`.

## Responsive

- Breakpoints: Tailwind defaults. `md` (768) is the app's phone/desktop
  line (sidebar, page sheet, gutter, tab bar, `useIsMobile`); `sm` (640)
  for dialog → bottom sheet (`max-sm:`) and small form layouts; `lg`
  (1024) for side panels and two-column pages; `xl` for the widest gutter.
- Mobile-first: base classes are the phone; add `md:` for desktop. Use
  `max-md:` / `max-sm:` only for phone-only overrides of a desktop-first
  shared component.

## Safe area

- Page bottom on phones: `pb-[calc(6.5rem+env(safe-area-inset-bottom))]`
  (tab bar room), `md:pb-6` (layout).
- Tab bar: `pb-[max(calc(env(safe-area-inset-bottom)+0.5rem),1.75rem)]`.
- Phone sheets / dialogs: `max-sm:pb-[env(safe-area-inset-bottom)]`
  (`dialogSheetOnMobileClassName`).
- Only the layout and these shared components handle safe areas.

## Role tokens (use these)

Defined in `src/app/globals.css` (`--spacing-*`), registered in
`src/lib/utils.ts`. Measured on /ui → Spacing.

| Class                      | Value | For                                                                    |
| -------------------------- | ----- | ---------------------------------------------------------------------- |
| `gap-field`                | 8px   | a label → its control (measured: 18 / 18 pairs on /ui → Form at 8.0px) |
| `gap-fields`               | 16px  | field → field                                                          |
| `gap-inline`               | 8px   | buttons / chips side by side                                           |
| `gap-section`              | 32px  | section → section on a page                                            |
| `p-surface` / `px-surface` | 20px  | card, dialog, sheet padding                                            |

- `PageHeader` owns its spacing (the sheet's `pt-3`, its own `pb-3`): don't pass it.
- Pages add no bottom padding: the layout does (`md:pb-6`, and room for
  the phone tab bar).
- `flex flex-col gap-*`, not `space-y-*` (a hidden child leaves no gap).
- Steps of 4px only (no `gap-7`, no `py-[4px]`).

## Rules

- 4px grid, whole steps on pages. A value outside the table needs a
  reason next to it.
- `gap-*` on a flex/grid parent, never `space-y-*` / `space-x-*` or margins
  between siblings.
- Side padding of page content comes only from `gutter-x`; overhang only
  from `bleed` (strips, separators). Lists and tables on the page don't
  overhang (`list-bleed`).
- Every `PageHeader` is the same 32px row 12px from the top, 14px medium
  (like "Kantor"); pages add no bottom padding.
- Scrolling panes use `scroll-pane pane-px-*`, not `overflow-y-auto px-*`.
- Card, dialog and sheet padding is 20px (`p-5` / `pane-px-5`).

## Don't

- `px-4 md:px-8` on a page block (use the gutter).
- `-mx-4` / `-mx-5` to break out of a container (use `bleed`, or set the
  box's `--bleed`).
- `space-y-4`, `mt-4` on every child, `gap-2.5` / `gap-7` on pages.
- `p-[3px]`, `py-[4px]`, other arbitrary px spacing.
- `overflow-y-auto px-5` on a sheet body (uneven sides with a scrollbar).
- `pb-16` / `pb-6` at the bottom of a page.

## Good examples

- Page: `src/page-slices/teams/ui/TeamsPage.tsx` (header, stats strip, search, table)
- Card: `src/app/(main)/dashboard/components/home-card.tsx`
- Dialog: `src/components/ui/dialog-sections.tsx`
- Sheet with nested gutter: `src/page-slices/performance/ui/kpi/ProjectKpiSheet.tsx`

## Example

```tsx
<div className="flex flex-col">
  <PageHeader
    className="pt-6 pb-4"
    title="Klien"
    actions={<Button>Baru</Button>}
  />
  <TabNavigation className="mb-4">…</TabNavigation>
  <div className="mb-4 w-full sm:max-w-sm">
    <InputGroup>…</InputGroup>
  </div>
  <GroupedList>…</GroupedList>
</div>
```

## Migration notes

Done 2026-11-05 (local): role tokens above; `PageHeader` default
padding (36 caller copies removed); page-bottom paddings removed (Santuy,
Finance, KPI, Notes, What's new, dashboard, /ui); 82 label → control
stacks on `gap-field`, `Field` too; 53 `space-y` → flex gap; `gap-7` →
6 / 8; `py-[4px]` → `py-1`; the drawer's `--bleed` renamed
`--drawer-bleed`; HomeCard on `p-surface`. Kept: segmented / tabs 3px
internals (optical), the Mac traffic-light offset.
The older list below is kept for reference.

- **PageHeader spacing is copied into every caller**: 31 of 32 pass
  `className="pt-6 pb-4"` (`src/page-slices/finance/ui/FinancePage.tsx:151`
  uses `pt-6` + parent `gap-4`, same result) → make `pt-6 pb-4` the
  default in `src/components/page-header.tsx`.
- **Page bottom padding** although the layout already adds it:
  `src/page-slices/ui-docs/ui/UiDocsPage.tsx:26` (`pb-16`),
  `src/page-slices/santuy/ui/SantuyPage.tsx:94` and `FinancePage.tsx:149`
  (`pb-6`), `src/page-slices/performance/ui/kpi/EmployeeKpiPage.tsx:46`,
  `src/page-slices/projects/ui/my-notes/MyNotesPage.tsx:228` (`pb-4`),
  `src/page-slices/whats-new/ui/WhatsNewPage.tsx:255` (`pb-10`),
  `HomeColumn` (`pb-10`) → remove, or settle one page-bottom value in the
  layout.
- **Tabs → content**: `TabNavigation mb-4` on pages, `mb-8` on
  `UiDocsPage.tsx:28` → `mb-4` (or a documented docs-only value).
- **`space-y-*` / `space-x-*`** (64 uses) → `flex flex-col gap-*`. Most in
  `src/widgets/event-calendar/ui/` (`dialog-variants/BaseReadOnlyDialog.tsx`,
  `event-dialog.tsx`, `LeaveDialog.tsx`, `month-view.tsx`, `MeetingDialog.tsx`,
  `HolidayDialog.tsx`), `src/page-slices/leave/ui/StakeholderLeavePage.tsx`,
  the `loading.tsx` skeletons, `components/markdown.tsx`,
  `components/callout-box.tsx`.
- **Label → control gap**: `gap-2` (49 uses) vs `gap-1.5` (31:
  `src/page-slices/projects/ui/ProjectForm.tsx` ×8,
  `invoice/InvoiceSettingsDialog.tsx` ×4,
  `performance/ui/meeting/OneOnOne.tsx` ×4,
  `widgets/notifications/ui/AnnouncementDialog.tsx` ×3,
  `ProjectDocuments.tsx`, `CompetencyLibrary.tsx`, `BriefCreateDialog.tsx`)
  → `gap-2`; better, one shared field wrapper (`ui/field.tsx` `Field` is
  `gap-3` and used in only 2 files: align it or retire it).
- **Off-grid gaps on pages**: `gap-7` (`TaskDialog.tsx:297`,
  `MyNotesPage.tsx:551`, `BriefBuilder.tsx:693`,
  `components/tab-navigation.tsx:53`), `gap-y-7`
  (`PaymentMethodsPage.tsx:219`), `gap-2.5` (48 uses outside components
  that need it) → nearest whole step (`gap-6` / `gap-8`, `gap-2` / `gap-3`).
  `gap-5` is fine only where it matches a 20px dialog padding.
- **Arbitrary spacing**: `src/components/segmented-control.tsx:52`
  `p-[3px]`, `src/components/ui/tabs.tsx:61` `mt-[3px]`,
  `src/components/file-field.tsx:64` `pl-[3px]`,
  `src/widgets/event-calendar/ui/event-item.tsx:107,133` `py-[4px]`
  (= `py-1`). Exempt: `InvoiceDocument.tsx` (print units),
  `app-topbar.tsx:66` `pl-[5.25rem]` (Mac traffic lights).
- **Gutter defined twice**: `src/app/(main)/layout.tsx:131` and
  `src/page-slices/projects/ui/portal/PortalShell.tsx:223` repeat the
  `--bleed` / `--page-gutter` / `--sbw` classes → one shared
  `pageSheetClassName` constant.
- **Manual bleed width**: `src/components/ui/table.tsx:10` (as
  `var(--list-overhang,…)`) and `dashboard/components/home-card.tsx:42`
  (`w-[calc(100%+2*var(--page-gutter,1rem))]`) write the widened width by
  hand → a `bleed-w` utility next to `bleed` / `list-bleed`.
- **`--bleed` name clash**: `src/components/ui/drawer.tsx:132` sets
  `[--bleed:3rem]` for its swipe overhang; a `GroupedList` / `bleed` inside
  a Drawer inherits it (3rem overhang, 3rem gutter) → rename the drawer's
  variable (e.g. `--drawer-bleed`).
- **Breakouts with negative margins** instead of `bleed`:
  `src/page-slices/finance/ui/SubscriptionsTab.tsx:485` (`-mx-5 -mb-5`),
  `src/page-slices/policies/ui/ai-assist.tsx:737` (`-mx-4`),
  `src/components/ui/accordion.tsx:19,58` (`-mx-4 px-4`).
- **Scrollers without `scroll-pane`** that have side padding:
  `src/widgets/menubar/ui/MenubarPopover.tsx:1169,1197,1268,1376` (hidden
  scrollbar, so harmless; keep as `no-scrollbar`).
