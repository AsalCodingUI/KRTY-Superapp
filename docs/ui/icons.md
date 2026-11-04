# Icons

Every icon in the app: where it comes from, its size in each context, color,
stroke, labels, and the app's own glyphs (status, stage, priority, app icon).
Live examples: **/ui** → Icons.

## Use

| Need                          | Use                                                                                                                                                                    | File                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Any icon                      | `import { Bell } from "@/components/icons"` (app names, lucide-style)                                                                                                  | `src/components/icons/index.tsx`  |
| An icon not in the list yet   | add two lines to `index.tsx`: `import { Glyph as UGlyph } from "@untitledui/icons/Glyph"` and `export const Name = icon(UGlyph, "Name")` (browse untitledui.com/icons) | same                              |
| A symbol Untitled UI lacks    | draw it in `custom.tsx` (`glyph(name, d)`, 24px grid, `STROKE`), export it from `index.tsx`                                                                            | `src/components/icons/custom.tsx` |
| Existing `Ri*` names (legacy) | `@/shared/ui/lucide-icons` (aliases to the above)                                                                                                                      | `src/shared/ui/lucide-icons.tsx`  |
| Loading                       | `Spinner` (not an icon + `animate-spin`)                                                                                                                               | `src/components/ui/spinner.tsx`   |

The icon set is **Untitled UI Icons**, the free line set (1,100+ icons;
free for personal and commercial use, but not to redistribute as an icon
library, so the icons stay an npm dependency, not files in this repo).
`index.tsx` maps the app's icon names to Untitled UI glyphs, so pages
never import `@untitledui/icons` themselves. The one glyph it lacks
(`Coffee`) is drawn in `custom.tsx`. There is no filled set: `weight`
props are accepted and ignored. Every icon is listed on /ui → Icons.

## Rules

**Source**

- Import icons only from `@/components/icons` (never `@untitledui/icons`
  directly). Don't add new `Ri*` aliases.
- Line icons only. Show a state with color or a dot, not a filled icon.
- One icon per meaning: edit = `SquarePen`, delete = `Delete` (trash),
  more = `MoreHorizontal`, close = `X`, add = `Plus`, open in new =
  `ExternalLink`, copy = `Copy`, status done = `CircleCheck`, warning =
  `TriangleAlert`, error / info = `CircleAlert` / `Info`.
- No other icon libraries (no Remixicon, Heroicons, react-icons).

**Size by context**

| Context                                                        | Size                            |
| -------------------------------------------------------------- | ------------------------------- |
| Buttons, menus, rows, inputs, nav, list group headers          | `size-4` (16px), the default    |
| Next to 13px text: chips, tabs, meta lines, `Button size="xs"` | `size-3.5` (14px)               |
| Inside `Badge`, `Button size="xs" / "icon-xs"`                 | `size-3` (set by the component) |
| `EmptyState` tile, panel empties                               | `size-5` (set by the component) |
| Centered section loading                                       | `Spinner className="size-6"`    |

- In a `Button`, put the icon first / last with `data-icon="inline-start"`
  / `"inline-end"` and **no size class**: the button sizes it (16px; 12px
  for `xs` / `icon-xs`) and tightens its padding.
- Components that size their icons (`EmptyState`, `Badge`, `Button`,
  `DropdownMenuItem`, `SidebarMenuButton`, `TabNavigation`, `ViewToggle`):
  pass the bare icon.
- `size-*`, never `h-4 w-4`. Add `shrink-0` when it sits beside text that
  can wrap or truncate.

**Color and stroke**

- Icons inherit `currentColor`. Quiet icons: `text-muted-foreground`;
  status: `text-success-ink`, `text-warning`, `text-destructive`. Semantic
  tokens only.
- Stroke: **1.75 on the 24px grid** for every icon (about 1.2px at
  `size-4`; Untitled UI's own is 2), set once as `STROKE` in
  `src/components/icons/custom.tsx`. It's a plain SVG attribute, so any
  value costs nothing. `strokeWidth` on a single icon is ignored.
- Other hand-made glyphs (status, stage, priority): `viewBox="0 0 16 16"`,
  `fill="currentColor"` (or `stroke="currentColor"` at the same weight as
  `STROKE` on a 24 grid, i.e. about 1.15 on 16), `aria-hidden`, base class `size-4 shrink-0`, cut-outs with
  `fillRule="evenodd"` so they sit on any surface. Filled variants of a
  line icon (the open tab, notification kinds) keep the line icon's shape.

**Labels**

- Decorative icons next to text: `aria-hidden` (custom SVGs), nothing more.
- Icon-only buttons: `Button size="icon-sm"` (or `icon` / `icon-xs`) with
  `aria-label`; add `title` (or a `Tooltip`) for a hover hint. `title`
  alone is not a label.
- A status glyph that stands alone (no text beside it) needs the text
  somewhere: `aria-label` on its container or a `Tooltip`.

**Light**

- Icons are static SVGs and each is its own module
  (`@untitledui/icons/<Name>`), so only the icons the app uses are
  bundled. No icon animations (the old animated set is gone).
- Icons passed as data (menu configs, nav items) are components, not
  elements: `icon: Copy`, rendered by the menu at its size.

**App icon and avatars**

- `AppIcon`: `variant="tile"` (the square tile, caller rounds it) or
  `"mark"` (transparent, black / white per theme); `size` is the PNG
  (96 / 192 / 512 / 1024), about 4x the shown size; the shown size is the
  `className` (`size-4` in the sidebar, `size-[22px]` in the top bar,
  `screenLogoClass` on minimal screens).
- `ProjectAvatar`: `size-5 rounded-[5px]`, white letter on the project's
  color (`projectColor(id)`); don't draw your own project tile.

## Don't

- `h-4 w-4` (use `size-4`), or a size class on an icon inside `Button`,
  `EmptyState` or `Badge`.
- `<RiLoader2Line className="animate-spin" />` (use `Spinner`).
- `Trash2` / `Pencil` for delete / edit (use `Delete` / `SquarePen`).
- An icon-only button with only `title`, or with no label.
- Raw palette colors on icons (`text-orange-500`), hex fills, `!important`.
- `strokeWidth` on one icon (the stroke is `STROKE`, for all).
- Copying an SVG path into a page when a shared glyph exists.

## Not icons (keep their own)

Illustrations and brand marks: `FolderIcon` (yellow folder, `row-menu.tsx`),
the Figma mark (`DesignLinks.tsx`), the Google "G" (`login/page.tsx`),
OG card art (`src/shared/og/card.tsx`), charts (`MyKpiView.tsx` gauge).

## Good examples

- Icon buttons with labels: `src/page-slices/leave/ui/components/ApprovalInbox.tsx`
- Buttons with leading icons: `src/components/error-view.tsx`,
  `src/components/not-found-view.tsx`
- Custom glyphs: `ProjectStatusIcon.tsx`, `TaskPriority.tsx`
- Filled variants: `src/widgets/notifications/ui/notification-icons.tsx`

## Example

```tsx
import { Plus, SquarePen } from "@/components/icons"

<Button size="sm">
  <Plus data-icon="inline-start" />
  Project baru
</Button>

<Button variant="ghost" size="icon-sm" aria-label="Edit" title="Edit">
  <SquarePen />
</Button>

<span className="text-muted-foreground flex items-center gap-1.5 text-[13px]">
  <CalendarDays className="size-3.5 shrink-0" />
  12 Nov
</span>
```

## Migration notes

Done 2026-11-05: the whole app moved from lucide / lucide-animated to
Untitled UI Icons through `@/components/icons` (all `lucide-react` imports
repointed, the animated icon files removed, lucide and the interim Reicon
set removed), stroke 1.75.

Nothing below is changed yet.

**Ri\* aliases** (`src/shared/ui/lucide-icons.tsx`, 124 importing files):
Remixicon names kept from the old kit, now pointing at the Untitled UI
icons (`*Fill` are the same line icons). Codemod them to the app names from
`@/components/icons` over time, then delete the file. Misleading ones:
`RiGoogleFill` → `Chrome`,
`RiWhatsappLine` → `Phone`, `RiSettings3Line` → `SlidersHorizontal`,
`RiFileList3Line` → `ListChecks`, `RiFundsBoxLine` → `Wallet`;
`RiDeleteBinLine` / `RiDeleteBin6Line`, `RiEditLine` / `RiEdit2Line` /
`RiPencilLine`, `RiCalendarLine` / `RiCalendar2Line` are duplicates.

**`h-N w-N` → `size-N`**: `src/widgets/event-calendar/ui/components/GuestList.tsx:51,105,107,109`,
`ReminderPicker.tsx:92`, `MeetingButton.tsx:48`,
`dialog-variants/MeetingDialog.tsx:147,170`,
`dialog-variants/BaseReadOnlyDialog.tsx:121,171,184`,
`dialog-variants/LeaveDialog.tsx:80,89,120`,
`src/entities/calendar/ui/EventCard.tsx:122,130,136`,
`portal/PortalLibrary.tsx:114`, `workspace/ProjectLibrary.tsx:250` (`FolderIcon`).

**Redundant sizes**: 32 `EmptyState icon={<Ri… className="size-5" />}`
(the tile already sets `[&_svg]:size-5`), e.g. `ProjectList.tsx:137`,
`EmployeeLeaveList.tsx:64`, `MyTasksPage.tsx:342,400`,
`event-calendar/ui/components/EmptyState.tsx:23,34` → pass the bare icon.
`ProjectTasks.tsx:829` (`data-icon` + `size-3.5` in a button) → check the
button size, drop the class. `Notifications.tsx:89`
(`variant === "default" ? "size-4 shrink-0" : "size-4"`) → `size-4 shrink-0`.

**Labels**: `src/page-slices/leave/ui/components/AdminColumns.tsx:226,239`
(icon buttons with `title` only) → add `aria-label`.
`src/page-slices/projects/ui/portal/PortalShell.tsx:341,352,363,374`
(filled tab SVGs without `aria-hidden`) → add it.

**Loading as an icon**: `src/features/leave-request/ui/LeaveRequestForm.tsx:157`
(`RiLoader2Line animate-spin`) → `Spinner className="size-3"`.

**Color**: `ProjectStageIcon.tsx:8-12` `STAGE_TONE` uses raw palette with
`!` (`text-fuchsia-500!`, `text-orange-500!`, `text-emerald-500!`) → stage
tokens (e.g. `--stage-branding`) or the 12-step scale (`text-pink-9`), and
fix the menu button that greys icons instead of forcing `!`.
`row-menu.tsx:28-36` (`FolderIcon` hex fills) is an illustration: keep, but
move the hexes to tokens if a second folder appears.
