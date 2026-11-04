# Buttons

Every clickable action that isn't a link in running text: page and dialog
actions, row and card icon buttons, toolbar buttons, link buttons. Live
examples: **/ui** → Tombol.

## Use

| Need                                 | Use                                                          | File                                                 |
| ------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------- |
| Any button                           | `Button variant size`                                        | `src/components/ui/button.tsx`                       |
| Icon next to the label               | the icon with `data-icon="inline-start"` / `"inline-end"`    | same                                                 |
| Busy (saving, uploading)             | `disabled` + `<Spinner data-icon="inline-start" />` + "…ing" | `src/components/ui/spinner.tsx`                      |
| Icon-only                            | `size="icon-*"` + `aria-label` + `Tooltip`                   | `src/components/ui/tooltip.tsx`                      |
| A link that looks like a button      | `Button nativeButton={false} render={<Link … />}`            | `button.tsx` + `next/link`                           |
| Joined buttons (split button)        | `ButtonGroup`                                                | `src/components/ui/button-group.tsx`                 |
| Page actions                         | `PageHeader actions={…}`                                     | `src/components/page-header.tsx`                     |
| Dialog actions                       | `DialogFooter`                                               | `src/components/ui/dialog.tsx`                       |
| Row ⋯ menu                           | `RowMenu`                                                    | `src/page-slices/projects/ui/workspace/row-menu.tsx` |
| Card header "open page" icon         | `HomeIconLink`                                               | `src/app/(main)/dashboard/components/home-card.tsx`  |
| Home quick actions                   | `HomeAction` (lg, outline / primary)                         | same                                                 |
| Back ← before a page title           | `PageHeader back={…}` (outline icon-sm + tooltip)            | `page-header.tsx`                                    |
| Light / dark flip (no sidebar pages) | `ThemeToggleButton`                                          | `src/components/theme-toggle-button.tsx`             |
| Controls on minimal screens          | `ScreenControls` (pill, top right)                           | `src/components/minimal-screen.tsx`                  |
| Sidebar toggle                       | `SidebarTrigger`                                             | `src/components/ui/sidebar.tsx`                      |
| Pressed / on-off button              | `Button aria-pressed` (+ `variant="secondary"` while on)     | `button.tsx`                                         |

## Use these (Nov 2026)

- Quiet destructive (Hapus in a footer, Keluar, reject icon):
  `variant="destructive-ghost"`. Never ghost / outline + `text-destructive-ink`.
- The confirm of a destructive action: `variant="destructive"`.
- Height and padding come from `size` only (`xs` 24 · `sm` 28 · `default`
  32 · `lg` 40; `icon-*` the same). No `h-*`, `px-*`, `size-*`,
  `rounded-full`, `text-[13px]` or `font-normal` on a Button.
- Busy: `disabled` + `{busy && <Spinner data-icon="inline-start" />}` +
  the "-ing" label.
- Icon-only: `aria-label` + `Tooltip` (`TooltipTrigger render={<Button … />}`),
  not `title=`.

## Variants

Usage across `src` (Nov 2026, 478 buttons): ghost 191, outline 133,
default 106, secondary 20, destructive 13, link 1.

| Variant             | For                                                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `default`           | The one primary action of a page, dialog or card (Save, Create, Upload). One per area.                                  |
| `outline`           | Every other action next to it (Cancel, Export, Filter). The default "secondary" button.                                 |
| `ghost`             | Quiet actions: icon buttons in rows, cards, headers, toolbars; "add another" links in forms.                            |
| `secondary`         | A button sitting on a field (FileField's "Pilih file") or a pressed toggle (`aria-pressed`). Not a second outline.      |
| `destructive`       | The confirm of a destructive action (Hapus in a confirm dialog). Tinted, not solid red.                                 |
| `destructive-ghost` | A quiet destructive text or icon button: Hapus in a footer, Keluar, Batalkan slot, Tolak. Red label, red tint on hover. |
| `link`              | Inline "Lihat ›" at the end of a card (`HomeFooter`). With `size="sm" className="h-auto px-0"`.                         |

## Sizes

Usage: default 217, sm 121, icon-sm 80, icon 21, icon-xs 15, lg 12, xs 5,
icon-lg 0.

| Size      | Height | For                                                                      |
| --------- | ------ | ------------------------------------------------------------------------ |
| `xs`      | 24px   | Inside a field (FileField), dense inline chips of action                 |
| `sm`      | 28px   | Rows, cards, toolbars, popovers, "add another" under a list              |
| `default` | 32px   | Page header, dialog footer, forms (matches Input / SelectTrigger h-8)    |
| `lg`      | 40px   | Home quick actions (`HomeAction`), minimal screens (login, PIN, connect) |
| `icon-xs` | 24px   | Dense rows: comments, timeline, queue rows                               |
| `icon-sm` | 28px   | The usual icon button: row ⋯, card header, dialog close, back ←          |
| `icon`    | 32px   | Icon button next to `default` buttons (PageHeader actions, pager)        |
| `icon-lg` | 40px   | Next to `lg` buttons only                                                |

## Rules

**Shape and look** (all in `buttonVariants`, never per page)

- Pill (`rounded-full`), `text-sm font-medium`, icons `size-4`
  (`size-3` at xs / icon-xs), press `active:scale-[0.97]`.
- Focus: `focus-visible:border-primary/50 ring-2 ring-primary/15`.
  Disabled: `opacity-50`, no pointer events.
- Icon + label: put `data-icon="inline-start"` (or `inline-end`) on the
  icon; the button trims its own padding on that side. No `mr-2` / `gap-*`.

**Choosing**

- One `default` per area. Everything else beside it is `outline`;
  quieter still is `ghost`.
- Size follows the neighbours: the same height as the fields or buttons
  in the same row (h-8 forms → `default` / `icon`; rows → `sm` /
  `icon-sm`).

**Placement**

- Page: actions in `PageHeader actions`, primary last (rightmost). On
  phones, keep the icon and hide the label with
  `<span className="hidden sm:inline">` (FinancePage).
- Dialog: `DialogFooter`, right-aligned: Cancel (`outline`) then the
  primary. A destructive secondary action (Hapus) goes far left with
  `sm:mr-auto`. The submit button is `type="submit" form="<form id>"`.
- Card: header icon actions are `ghost icon-sm text-muted-foreground`
  (`HomeIconLink`); the card's closing link is `variant="link"`.
- Row: actions show on hover (`ListRowActions`, `RowMenu`), revealed with
  `opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100
data-popup-open:opacity-100`.

**Busy**

- While saving: `disabled`, the label becomes the "-ing" form
  (`tc("saving")`), and a `<Spinner data-icon="inline-start" />` replaces
  the leading icon. The button keeps its width class; don't swap it for a
  bare spinner.

**Icon-only**

- Always `aria-label` (what it does, e.g. "Hapus catatan").
- Add a `Tooltip` (`TooltipTrigger render={<Button … />}`) unless the icon
  is universal (× close in a dialog corner, ‹ › in a pager). Not `title=`.
- Quiet delete in a row: `ghost icon-sm` +
  `text-muted-foreground hover:text-destructive`.

**Links**

- Navigation is a link: `nativeButton={false} render={<Link href
prefetch={false} />}` (or `PrefetchLink`). Never `onClick={() =>
router.push()}` on a button for plain navigation.

**Destructive**

- Confirm dialogs: `variant="destructive"` on the confirm button
  (`ConfirmDialog`).
- A quiet "Hapus" / "Keluar" text button in a footer or row, or a
  red icon action (reject): `variant="destructive-ghost"`. No colour
  override in `className`.

**Allowed `className` on Button**: layout (`w-full`, `flex-1`,
`self-start`, `ml-auto`, `shrink-0`, `mt-*`, `-m*` to align an icon with
text), the hover-reveal opacity classes above, `text-muted-foreground` on
ghost icon buttons, `hover:text-destructive-ink`, `blend-ink` on chrome. Not
height, padding, radius, font size, background or border.

**Custom buttons (keep their own style)**

- `RowMenu` trigger: ghost icon-sm, muted, hover-revealed; stops the row
  click.
- `HomeIconLink`: ghost icon-sm link, muted.
- `ScreenControls`: frosted pill (`bg-background/80`, `p-1`,
  `shadow-(--elev-1)`), top right on minimal screens; buttons in it are
  `ThemeToggleButton className="size-9 rounded-full"`.
- `ThemeToggleButton`: ghost icon-sm, `blend-ink` muted.
- `SidebarTrigger`, sidebar rows (`SidebarMenuButton`), `SegmentedControl`
  and `ViewToggle` items, `TabNavigationLink`: their own components, see
  navigation.md.
- Whole-row / whole-card click targets (`<button>` wrapping a row) are
  rows, not buttons: table.md.

## Don't

- `className="h-9 px-4"`, `h-7 px-2.5 text-[13px]`, `size-6` on a
  `size="icon-sm"`: pick the size that exists.
- Restating a variant: `bg-primary hover:bg-primary/90
text-primary-foreground` on a default button, `rounded-full` on any
  button.
- A raw `<button className="hover:bg-muted rounded-md size-6 …">` for an
  icon action: `Button variant="ghost" size="icon-xs"`.
- `outline` + `text-destructive hover:bg-destructive/10` (a third
  destructive look).
- Icon-only buttons with only `title=` (no `aria-label`, no tooltip).
- Two `default` buttons side by side.
- `<Loader2 className="animate-spin" />` in a button: use `Spinner`.

## Good examples

- Page actions, icon + tooltip: `src/page-slices/finance/ui/FinancePage.tsx`
- Dialog footer with submit by form id: `src/page-slices/clients/ui/ClientFormDialog.tsx`
- Busy with Spinner: `src/page-slices/contracts/ui/ContractFormDialog.tsx`
- Split button: `src/page-slices/projects/ui/workspace/ProjectLibrary.tsx` (Upload)
- Icon buttons with tooltips: `src/page-slices/projects/ui/my-notes/MyNotesPage.tsx`
- Link buttons: `src/app/(main)/dashboard/components/home-card.tsx`

## Example

```tsx
<PageHeader
  title="Keuangan"
  actions={
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label="Sembunyikan nominal"
              className="text-muted-foreground"
            />
          }
        >
          <EyeOff />
        </TooltipTrigger>
        <TooltipContent>Sembunyikan nominal</TooltipContent>
      </Tooltip>
      <Button onClick={add}>
        <RiAddLine data-icon="inline-start" />
        <span className="hidden sm:inline">Tambah langganan</span>
      </Button>
    </>
  }
/>

<DialogFooter>
  <Button type="button" variant="outline" onClick={close}>
    {tc("cancel")}
  </Button>
  <Button type="submit" form="client-form" disabled={saving}>
    {saving && <Spinner data-icon="inline-start" />}
    {saving ? tc("saving") : tc("save")}
  </Button>
</DialogFooter>
```

## Migration notes

Done 2026-11-05 (local): `destructive-ghost` added to `buttonVariants`
and used for the 14 ghost / outline + `text-destructive-ink` buttons
(PortalShell, ProjectSettings, ReportDialog, ClientPortalCard,
InvoiceSettingsDialog, InvoiceEditorDialog, SubscriptionDialog,
GoalDialog, CompetencyLibrary, OneOnOne ×2, mobile-nav, event-dialog,
SharingSantuyDialog) and the leave reject icon; BaseReadOnlyDialog and
MeetingDialog's outline + `hover:bg-destructive/10` → `destructive`.
Size overrides fixed: MenubarPopover `h-9 px-4` → default (sign-in →
`lg`), ProjectLineage (`h-7 px-2.5 text-meta` dropped, `size-6` →
`icon-xs`, `font-normal` dropped), TaskDialog / TaskBoard / ReportViews
type and padding overrides dropped, PhaseRail `h-5 rounded-full px-2`
dropped, BriefForm redundant `size-7` dropped, ReminderPicker `h-6 w-6
p-0` → `icon-xs` (+ `aria-label`), MeetingButton's restated default
dropped, `rounded-full` dropped (InvoiceEditorDialog ×2, MyOneOnOne,
ProjectScoringView, file-viewer ×2), data-table-filterbar → `outline`.
Spinner added to 20 label-only busy buttons (all those listed below plus
update-password, ContractDialog, ProjectScoringView ×2);
LeaveRequestForm's `RiLoader2Line animate-spin` → `Spinner`.
AdminColumns approve / reject, `HomeIconLink` and `ThemeToggleButton`:
`aria-label` + `Tooltip` instead of `title=`. Before / after and the
measured sizes are on /ui → Tombol.

Still open: the date-picker preset list (its bordered chip look on
phones needs a design decision), `appearance-popover`'s chrome trigger,
the responsive icon-only `max-sm:w-8 max-sm:px-0` buttons, the raw
`<button>`s, `title=` on the other ~30 icon buttons that already have an
`aria-label`, the `<Link prefetch>` list, and `text-muted-foreground` as
a ghost-icon default. The older list below is kept for reference.

Found Nov 2026; fix in place, then delete the line.

**Missing variants (add to `button.tsx`, then replace)**

- Quiet destructive text button, `ghost` + `text-destructive
hover:text-destructive` (add `destructive-ghost`):
  `projects/ui/portal/PortalShell.tsx:320`,
  `projects/ui/workspace/ProjectSettings.tsx:350` (outline),
  `projects/ui/workspace/ReportDialog.tsx:338`,
  `projects/ui/workspace/ClientPortalCard.tsx:150`,
  `projects/ui/invoice/InvoiceSettingsDialog.tsx:454`,
  `projects/ui/invoice/InvoiceEditorDialog.tsx:1315`,
  `finance/ui/SubscriptionDialog.tsx:305`, `finance/ui/GoalDialog.tsx:85`
  (`text-destructive` only, no hover),
  `performance/ui/competency/CompetencyLibrary.tsx:258`,
  `performance/ui/meeting/OneOnOne.tsx:639,660`,
  `components/mobile-nav.tsx:120`,
  `widgets/event-calendar/ui/event-dialog.tsx:889`,
  `widgets/event-calendar/ui/dialog-variants/SharingSantuyDialog.tsx:273`.
- Third destructive look, `outline` + `text-destructive
hover:bg-destructive/10` → `destructive`:
  `widgets/event-calendar/ui/dialog-variants/BaseReadOnlyDialog.tsx:237`,
  `widgets/event-calendar/ui/dialog-variants/MeetingDialog.tsx:214`.
- `text-muted-foreground` is added to ~70 ghost icon buttons by hand;
  consider making it the ghost icon sizes' default.

**Size / shape overrides** (all paths under `src/`)

- `widgets/menubar/ui/MenubarPopover.tsx:1433,1464,1470,1479,1683`:
  `h-9 px-4` → `size="lg"` (or default).
- `projects/ui/ProjectLineage.tsx:122,138`: `size="sm"` + `h-7 px-2.5
text-[13px]` → plain `size="sm"`; `:192` `size="icon-sm"` +
  `size-6` → `icon-xs`; `:208` `text-[13px] font-normal` → drop.
- `projects/ui/workspace/TaskDialog.tsx:607`, `TaskBoard.tsx:450`,
  `ReportViews.tsx:51`: `text-[13px] font-normal` / `gap-1.5 px-2` on
  buttons → drop (one button type scale).
- `projects/ui/workspace/PhaseRail.tsx:160`: `xs` + `h-5 rounded-full
px-2` → `xs`.
- `briefs/ui/BriefForm.tsx:926,965`: `icon-sm` + `size-7` (redundant) →
  drop.
- `widgets/event-calendar/ui/components/ReminderPicker.tsx:85`: `h-6 w-6
p-0` on a default-size ghost → `size="icon-xs"`.
- `widgets/event-calendar/ui/components/MeetingButton.tsx:36`: restates
  the default variant (`bg-primary hover:bg-primary/90
text-primary-foreground`) → drop.
- `projects/ui/invoice/InvoiceEditorDialog.tsx:771,782`,
  `performance/ui/meeting/MyOneOnOne.tsx:195`: `rounded-full` → drop.
- `components/date-picker.tsx:279` (preset list): ghost restyled with
  `border data-active:bg-muted …` → a `SegmentedControl`-like list or
  `secondary aria-pressed`.
- `components/data-table/data-table-filterbar.tsx:72`: ghost + `border
text-primary px-2` → `outline`.
- Responsive icon-only via `max-sm:w-8 max-sm:px-0`:
  `whats-new/ui/WhatsNewPage.tsx:184`, `projects/ui/ProjectsFilterMenu.tsx:283`,
  `widgets/event-calendar/ui/CalendarToolbar.tsx:240` → one shared way
  (the `hidden sm:inline` label is enough for most).

**Icon-only accessibility**

- No `aria-label` (only `title`): `leave/ui/components/AdminColumns.tsx:226,239`
  (also `text-success-ink` on ghost; approve/reject read as colour only).
- `title=` instead of `Tooltip` on ~33 icon buttons, e.g. `HomeIconLink`
  (`home-card.tsx:155`), `ThemeToggleButton`, `AdminColumns.tsx`.
  `Tooltip` is used in only ~17 files.

**Busy state**

- ~20 buttons swap the label only (`{saving ? tc("saving") : tc("save")}`)
  with no Spinner: `clients/ui/ClientFormDialog.tsx:201`,
  `processes/ui/ProcessFormDialog.tsx:174`, `projects/ui/ProjectForm.tsx:607`,
  `projects/ui/workspace/ProjectDashboard.tsx:904,964`,
  `projects/ui/workspace/ProjectDocuments.tsx:610`,
  `projects/ui/invoice/InvoiceSettingsDialog.tsx:469`,
  `projects/ui/invoice/InvoiceEditorDialog.tsx:1297`,
  `finance/ui/SubscriptionDialog.tsx:318`, `finance/ui/FxRatesDialog.tsx:117`,
  `performance/ui/competency/CompetencyLibrary.tsx:356`,
  `performance/ui/meeting/OneOnOne.tsx:516`,
  `performance/ui/review/ReviewMonitoring.tsx:600`,
  `widgets/event-calendar/ui/event-dialog.tsx:919`,
  `widgets/profile/ui/AvatarCropDialog.tsx:192`,
  `policies/ui/PublishDialog.tsx:136` → add `Spinner data-icon`.
- `features/leave-request/ui/LeaveRequestForm.tsx:157`:
  `RiLoader2Line animate-spin` → `Spinner`.

**Raw `<button>`s that are buttons** (→ `Button ghost icon-xs/sm` or `xs`)

- `briefs/ui/BriefBuilder.tsx:734,927,954,1018,1138,1415,1484,1535`.
- `projects/ui/workspace/TaskDialog.tsx:1199` (size-5 icon).
- `projects/ui/invoice/InvoiceSettingsDialog.tsx:400` ("Hapus QR" text
  button) → `Button variant="link" size="xs"` or ghost xs.
- `processes/ui/ProcessEditorPage.tsx:523` (hover-destructive icon).
- `widgets/event-calendar/ui/month-view.tsx:307` (size-8 round icon).
- `components/sidebar-notices.tsx:121` (dismiss ×) is a deliberate
  floating badge; keep.

**Links**

- `<Link>` without `prefetch={false}` (runs the auth middleware on
  viewport): `projects/ui/my-tasks/MyTasksPage.tsx:542`,
  `projects/ui/portal/PortalOverview.tsx:185`,
  `projects/ui/portal/PortalShell.tsx:141,197,237,248`,
  `projects/ui/invoice/InvoiceEditorDialog.tsx:914`,
  `performance/ui/kpi/ProjectScoringView.tsx:743`,
  `leave/ui/components/LeaveRules.tsx:34,50`, `briefs/ui/BriefDialog.tsx:190`,
  `widgets/notifications/ui/NotificationsPanel.tsx:134`,
  `components/floating-tab-bar.tsx:80`, `error-view.tsx:37`,
  `not-found-view.tsx:36`.
