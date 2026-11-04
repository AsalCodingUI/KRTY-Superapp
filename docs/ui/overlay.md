# Overlays

Everything that opens over the page: dialogs, confirms, side sheets,
popovers, menus, the right-click menu, tooltips, ⌘K search, the image
lightbox and the file viewer. Live examples: **/ui** → Overlay.

## Use

| Need                                   | Use                                                          | File                                                                        |
| -------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| A task in a window (form, detail)      | `Dialog` + `DialogContent` + `DialogHeader/Footer`           | `src/components/ui/dialog.tsx`                                              |
| Custom window layout (editor, viewer)  | `DialogContent bare` (you build the inside)                  | same                                                                        |
| "Are you sure?" (delete, discard)      | `ConfirmDialog` / `useConfirmDialog()`                       | `src/components/confirm-dialog.tsx`                                         |
| A choice with 3 buttons (unsaved work) | `AlertDialog` + `AlertDialogHeader/Footer` + `Button`s       | `src/components/ui/alert-dialog.tsx`                                        |
| A detail panel over the page (right)   | `Sheet` + `SheetContent` (side `right`)                      | `src/components/ui/sheet.tsx`                                               |
| A docked panel that is always there    | `<aside data-slot="side-panel">` (see My notes)              | `src/page-slices/projects/ui/my-notes/MyNotesPage.tsx`                      |
| Small settings / info next to a button | `Popover` + `PopoverContent`                                 | `src/components/ui/popover.tsx`                                             |
| A list of actions from a button (⋯)    | `DropdownMenu`, or `RowMenu` for a row's ⋯                   | `src/components/ui/dropdown-menu.tsx`, `projects/ui/workspace/row-menu.tsx` |
| Right-click actions on a thing         | `ContextTarget` / `useContextTarget` / `registerContextType` | `src/shared/context-menu`                                                   |
| Name an icon-only button               | `Tooltip` + `TooltipTrigger` + `TooltipContent`              | `src/components/ui/tooltip.tsx`                                             |
| Search / jump anywhere                 | `GlobalSearch` (⌘K), open it with `openAppSearch(query)`     | `src/widgets/global-search/ui/GlobalSearch.tsx`                             |
| A searchable picker inside a dialog    | `Command*` (`CommandDialog` only for ⌘K-style)               | `src/components/ui/command.tsx`                                             |
| Pictures large                         | `ImageLightbox`, `LightboxScope`, `ZoomableImage`            | `src/components/image-lightbox.tsx`                                         |
| A private file full size               | `FileViewer` (lazy)                                          | `src/components/file-viewer.tsx`                                            |
| A file's thumbnail on a card           | `FilePreview`                                                | `src/page-slices/projects/ui/workspace/FilePreview.tsx`                     |

## Rules

**Dialog structure** (`DialogSections` in `dialog-sections.tsx` sorts the children)

- Children are `DialogHeader` (with `DialogTitle`, optional
  `DialogDescription`), then the body, then `DialogFooter`. Anything that
  is not header or footer becomes the body; fragments are flattened.
- Header: `px-5 pt-5 pr-12` (room for the ✕). Body: `dialogPanelClassName`
  = `scroll-pane pane-px-5 gap-4 pt-4 pb-1` — the body is the only part that
  scrolls. Footer: `px-5 pt-4 pb-5`. One surface: no bands, no dividers.
- Title `text-[15px] font-medium text-heading`; description `text-sm`
  muted. Every dialog has a `DialogTitle` (use `className="sr-only"` when
  it must not show; `bare` dialogs too).
- Footer buttons: cancel `variant="outline"` first, the main action last
  (right on desktop; on a phone the footer stacks with the main action on
  top). Destructive main action: `variant="destructive"`.
- The ✕ is built in (`showCloseButton`, top-3.5 right-3.5, `icon-sm`
  ghost). Don't add another close button; `showCloseButton={false}` only
  when the dialog has its own header with a close.

**Sizes** (on `DialogContent className`; width only from `sm:` up)

| Size                                                                                      | For                                                                             |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| default (`sm:max-w-[27.5rem]`, 440px)                                                     | Short forms, a single question, small pickers                                   |
| `sm:max-w-[35rem]` (560px)                                                                | Standard forms (leave request, project form, calendar)                          |
| `sm:max-w-2xl` (672px)                                                                    | Read-mostly details with more content                                           |
| `bare` + `sm:max-w-5xl` + `flex h-[min(56rem,92svh)] w-full flex-col overflow-hidden p-0` | Documents and viewers (report, note, policy, contract, file viewer, What's new) |
| `AlertDialogContent size="sm"` (`max-w-xs`)                                               | Tiny confirm with two equal buttons                                             |

The shell caps height at `calc(100svh-4rem)`; tall content scrolls in the
body, never the whole dialog. Special full-window layouts (invoice
editor, brief builder, task dialog two-column, Settings) are `bare` and
own their layout; don't copy them for normal dialogs.

**Confirm**

- Anything destructive or irreversible (delete, remove a member, discard)
  asks first with `ConfirmDialog variant="destructive"`; the title says
  what happens ("Hapus komentar ini?"), `description` only when it adds a
  consequence. `onConfirm` may be async: the dialog stays open with a
  spinner and closes when it resolves.
- In the right-click menu, `destructive: true, confirm: true` on the item
  is the confirm (second click runs it); skip it when `onSelect` opens its
  own dialog.
- Unsaved changes on close: an `AlertDialog` with Cancel / Discard / Save.

**Sheets**

- `SheetContent` default `side="right"`: floats 8px inside the page sheet
  (below the top bar and banners, `md:` 20px from the window), rounded
  `rounded-nested`, `shadow-(--elev-5)`, no dimming (transparent overlay),
  width `w-full sm:max-w-md` (wider: `data-[side=right]:sm:max-w-2xl`).
- Inside: `SheetHeader` (a 52px bar with `SheetTitle`, border-b), the
  body `scroll-pane pane-px-5 flex min-h-0 flex-1 flex-col gap-8 pt-5 pb-6`,
  optional `SheetFooter` (border-t, buttons right).
- A panel that is always open (docked, not modal) uses the same surface
  and position by hand with `data-slot="side-panel"` from `lg:`; the Mac
  app's layout insets both (`[data-slot=sheet-content][data-side=right]`
  and `[data-slot=side-panel]`, `app/(main)/layout.tsx` `DESKTOP_CSS`).
- Bottom sheets (`side="bottom"`) are for phones only.

**Popover, menus, tooltip**

- `PopoverContent`: `w-72 rounded-2xl p-4 gap-4 shadow-(--elev-4)`,
  `sideOffset 4`. Change only width (`w-64`, `w-80`) or padding
  (`p-0` when the content has its own, e.g. a calendar or a list).
- `DropdownMenuContent`: `align="start"` by default, `align="end"` for a
  ⋯ button on the right. Width from content; set `min-w-44` (or
  `min-w-40` for short labels) and nothing else. Destructive items:
  `variant="destructive"`, last, after a `DropdownMenuSeparator`.
- Row ⋯ menus: `RowMenu` (shows on row hover, stops the row click).
- Tooltip: short label of an icon-only control, dark pill (`bg-foreground`),
  `side="top"` default. One global `TooltipProvider` (`delay 0`) sits in
  `app/layout.tsx`; don't add another. Not for essential information
  (touch never shows it).
- All of these portal through `usePortalContainer()` so a themed region
  (dark panel) keeps its theme in its popups.

**Right-click menu** (`src/shared/context-menu/index.ts` is the full guide)

- Rows and cards that are a thing (project, task, report…) get a
  `ContextTarget type id label href items`. Same actions as the row's ⋯
  menu; `href` adds Open / Open in new tab / Copy link automatically.
- Items are built when the menu opens: keep `items` cheap (no fetching);
  async submenus use a loader.
- `access: ["pm", "stakeholder"]` hides items by role; `data-ctx="native"`
  opts a subtree out.

**Behaviour**

- Esc, the ✕, and a click outside close dialogs, sheets, popovers and
  menus (Base UI). Focus moves into the popup and returns to the trigger.
  `initialFocus={false}` only for popups that must not steal focus
  (date picker, bulk editor).
- Phones (`max-sm`, under 640px): every `Dialog` becomes a bottom sheet
  (`dialogSheetOnMobileClassName`: full width, `rounded-t-[28px]`,
  `max-h-[92svh]`, a grab handle, pull down to close). `AlertDialog`
  is a bottom sheet without the handle or drag. Panels that are sheets on
  desktop switch to `side="bottom"` on phones (Notifications).
- Overlay: `bg-backdrop` (a light tint, never a blur). No `backdrop-blur`
  on dialogs, sheets or popovers; only on small floating controls over
  media (file viewer arrows, gallery arrows).
- Layering: overlays `z-50`; the lightbox `z-[70]` (opens over a dialog).

**Light**

- Heavy dialogs (forms with editors, viewers, anything over ~10 kB or
  pulling a library) are `next/dynamic` imports, mounted on first open
  and kept mounted after (so the close animation plays):

  ```tsx
  const ReportDialog = dynamic(
    () => import("./ReportDialog").then((m) => m.ReportDialog),
    { loading: () => null },
  )
  const mounted = useMountOnce(open) // true from the first open onwards
  {
    mounted && <ReportDialog open={open} onOpenChange={setOpen} />
  }
  ```

  Dialogs that exist on every page load `{ ssr: false }` and preload on
  hover/focus of their trigger (`GlobalSearch`, `SettingsHost`).

- Render the dialog's content only while open when it is costly
  (`{open && <SearchPanel/>}` inside `CommandDialog`).

**URL-synced dialogs**

- A dialog that should be linkable keeps its state in the URL, English
  param names from `shared/lib/url-params.ts`: `?task=`, `?report=`,
  `?policy=`, `?settings=<tab>`. The value is `linkKey(name, id)`
  (`desain-logo-3f9a1c2b`); find the row with `findByLinkKey`, and keep
  old links pretty with `useCanonicalParam(name, raw, canonical)`.
- Closing removes the param. Opening a page-level item may `push` (Back
  closes it, as `PortalReports`); in-page windows replace. Prefer
  `replaceUrl(href, push?)` (no server round trip) over `router.replace`.

## Don't

- A `DialogContent` with its own `p-6`, `gap-*` or `border-b` header band
  (the sections already pad it), or a body without `scroll-pane`.
- A new width (`sm:max-w-[600px]`, `sm:max-w-[28rem]`, `sm:max-w-lg`) —
  pick from the size table.
- `window.confirm()` or a hand-made confirm dialog.
- Importing a heavy dialog statically into a page, or mounting it before
  it is first opened.
- `backdrop-blur` on an overlay, or a dark dim behind a right sheet.
- A second `TooltipProvider`, a `title=` attribute where a `Tooltip` is
  meant, a tooltip on a button that already has visible text.
- Using `@base-ui/react/*` primitives directly in a page; wrap them in
  `src/components/ui` first.
- `router.push` for a dialog param inside the app (it re-renders on the
  server); `replaceUrl`.

## Not overlays (keep their own style)

`InvoiceEditorDialog` (paper + panel, drop-shadow filter), `BriefBuilder`
(full window), `SettingsDialog` (two-pane), `TaskDialog` (two columns),
the floating tab bar, toasts (`sonner`, see feedback.md), the date
picker calendar.

## Good examples

- Form dialog: `src/page-slices/leave/ui/components/LeaveRequestModal.tsx`
- Document dialog (bare, 5xl, URL-synced): `src/page-slices/projects/ui/workspace/ReportDialog.tsx` + `ProjectReports.tsx`
- Confirm on delete: `src/components/confirm-dialog.tsx` users, e.g. task comments
- Right sheet: `src/widgets/profile/ui/ProfileSheet.tsx`
- Lazy dialogs, mount once: `src/page-slices/finance/ui/FinancePage.tsx`
- Right-click + ⋯ with the same actions: `src/page-slices/projects/ui/ProjectMenu.tsx`
- Linkable task: `src/page-slices/projects/ui/workspace/ProjectTasks.tsx`

## Example

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[35rem]">
    <DialogHeader>
      <DialogTitle>Ajukan cuti</DialogTitle>
      <DialogDescription>Atasan kamu dapat notifikasi.</DialogDescription>
    </DialogHeader>
    <FieldGroup>…</FieldGroup>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
      <Button onClick={submit}>Kirim</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

<ConfirmDialog
  open={!!removing}
  onOpenChange={(o) => !o && setRemoving(null)}
  title="Hapus komentar ini?"
  confirmText="Hapus"
  variant="destructive"
  onConfirm={() => remove(removing!)}
/>
```

## Migration notes

Sizes outside the table (→ nearest size):

- `src/components/mac-download.tsx:113`, `src/widgets/profile/ui/AvatarCropDialog.tsx:123`, `src/page-slices/projects/ui/workspace/ProjectDashboard.tsx:935` — `sm:max-w-sm` → default.
- `src/page-slices/projects/ui/CategoryManageDialog.tsx:106`, `src/page-slices/leave/ui/components/LeaveRequestDetailDialog.tsx:101` — `sm:max-w-md` → default or `sm:max-w-[35rem]`.
- `src/widgets/event-calendar/ui/dialog-variants/HolidayDialog.tsx:56` — `sm:max-w-[28rem]` → default (27.5rem) or 35rem like the other calendar dialogs.
- `src/page-slices/briefs/ui/BriefCreateDialog.tsx:131`, `src/widgets/notifications/ui/AnnouncementDialog.tsx:109` — `sm:max-w-lg` → `sm:max-w-[35rem]`.
- `src/page-slices/leave/ui/components/ApprovalInbox.tsx:273` — `sm:max-w-xl` → `sm:max-w-[35rem]` or `2xl`.
- `src/page-slices/performance/ui/review/MyReview.tsx:124,166` — `sm:max-w-4xl` → `2xl` or the 5xl document size.
- `src/components/ui/command.tsx:54` — `sm:max-w-[600px] sm:rounded-2xl!` (⌘K) → keep, but as a named constant; it is the one search size.

Repeated / one-off markup:

- The document-dialog class `flex h-[min(56rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl` is copied in 9 files with three heights (52/56/60rem, `88svh`): `components/file-viewer.tsx:158`, `contracts/ui/ContractDialog.tsx:99`, `projects/ui/workspace/ReportDialog.tsx:272`, `NoteDialog.tsx:191`, `portal/PortalReportDialog.tsx:52`, `policies/ui/PolicyDialog.tsx:77`, `PolicyEditor.tsx:108`, `whats-new/ui/WhatsNewDialog.tsx:49`, `WhatsNewEditor.tsx:198`, `briefs/ui/BriefDialog.tsx:155` → one `documentDialogClassName` in `dialog-sections.tsx`, one height.
- The unsaved-changes prompt (Cancel / Discard / Save `AlertDialog`) is hand-built in `projects/ui/workspace/ReportDialog.tsx:432`, `NoteDialog.tsx:254`, `projects/ui/invoice/InvoiceEditorDialog.tsx:1305`, `policies/ui/PolicyEditor.tsx:676` → a shared `UnsavedChangesDialog`.
- `useMountOnce` is defined twice: `page-slices/finance/ui/FinancePage.tsx:304`, `widgets/global-search/ui/GlobalSearch.tsx:19` → move to `src/shared/hooks/useMountOnce.ts`; use it for every lazy dialog.
- `src/page-slices/projects/ui/ProjectForm.tsx:259` — `window.confirm()` when removing a scored member → `ConfirmDialog variant="destructive"`.
- `src/page-slices/leave/ui/components/LeaveDetailsModal.tsx:84` — `[&>[data-slot=dialog-body]+div]:pb-3` reaches into the sections' footer → drop it or add a footer prop.
- `src/page-slices/projects/ui/invoice/InvoiceSettingsDialog.tsx:97` — its own `max-h-[min(46rem,90svh)] flex flex-col` (the shell already caps height) → remove.
- `src/widgets/event-calendar/ui/components/PickDateDialog.tsx:54` — `w-auto sm:max-w-fit` → a `Popover` with the calendar, or the default size.
- `src/widgets/event-calendar/ui/month-view.tsx:283` — a bottom `Sheet` with its own bordered `h3` header → `SheetHeader` + `SheetTitle`.
- `src/widgets/notifications/ui/NotificationsPanel.tsx:321` switches to a bottom sheet with `useIsMobile()` (under 768px) while dialogs switch under 640px → one breakpoint for "phone overlays".
- `src/page-slices/projects/ui/my-notes/MyNotesPage.tsx:367` — the side-panel surface classes are hand-copied from `SheetContent` → a `sidePanelClassName` (or `SidePanel`) exported from `sheet.tsx`.
- `src/components/image-lightbox.tsx:3` uses `@base-ui/react/dialog` directly (fine for the lightbox, it is the wrapper) — but it exports `ZoomableImage`, and `src/components/zoomable.tsx:255` exports a different `ZoomableImage` → rename one (`LightboxImage` / `PinchZoomImage`).
- `src/page-slices/projects/ui/workspace/FilePreview.tsx:36` `fileKind()` and `src/components/file-viewer.tsx:43` `previewKind()` decide the same thing with different lists → one helper.
- `projects/ui/workspace/ProjectTasks.tsx:160` and `ProjectReports.tsx:74` sync `?task=` / `?report=` with `router.replace`; `SettingsHost` uses `replaceUrl` → `replaceUrl`.
- `HomeIconLink` (`dashboard/components/home-card.tsx`), `ThemeSwitcher`, `ThemeToggleButton`, `AppearancePopover` name icon buttons with `title=` → `Tooltip` (or keep `aria-label` only).
- Unused overlay primitives: `src/components/ui/drawer.tsx`, `src/components/ui/hover-card.tsx` (no imports) → delete or document before use.
