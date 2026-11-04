# Icons

Every icon in the app: where it comes from, its size in each context, color,
stroke, labels, and the app's own glyphs (status, stage, priority, app icon).
Live examples: **/ui** → Icons.

## Use

| Need                          | Use                                                                                                                                                                        | File                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Any icon                      | `import { Bell } from "@/components/icons"` (app names, lucide-style)                                                                                                      | `src/components/icons/index.tsx` |
| The filled version            | `<Bell weight="Filled" />`                                                                                                                                                 | same                             |
| An icon not in the list yet   | add one line to `index.tsx`: `export const Name = reicon(RGlyph, "Name")` with the Reicon glyph (browse reicon.dev/icons; `import RGlyph from "reicon-react/icons/Glyph"`) | same                             |
| Existing `Ri*` names (legacy) | `@/shared/ui/lucide-icons` (aliases to the above; `*Fill` = Filled)                                                                                                        | `src/shared/ui/lucide-icons.tsx` |
| Loading                       | `Spinner` (not an icon + `animate-spin`)                                                                                                                                   | `src/components/ui/spinner.tsx`  |

The icon set is **Reicon** (MIT, Solar-based), in one weight for the
whole app (`DEFAULT_WEIGHT`, now Filled). `index.tsx` maps the app's icon names to Reicon
glyphs, so pages never import `reicon-react` or `lucide-react`
themselves. 25 glyphs Reicon doesn't have (editor headings, strikethrough,
pilcrow, tables / columns / rows, grips, corner arrows, double chevrons
up / down-up, plain circle / square / dashed circle, split, separator,
GitHub, Twitter) come from lucide inside `index.tsx`, drawn at stroke 1.5
to sit with Reicon; swap them when Reicon adds them. Every icon is listed,
Outline and Filled, on /ui → Icons.

## Rules

**Source**

- Import icons only from `@/components/icons` (never `reicon-react` or
  `lucide-react` directly). Don't add new `Ri*` aliases.
- The weight is one app-wide setting, `DEFAULT_WEIGHT` in
  `src/components/icons/index.tsx` (now **Filled**). Don't pass `weight`
  per icon unless one icon must differ from the set; to switch the whole
  app to Outline, change that one constant. The lucide fallbacks have no
  filled form and stay as line icons.
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
- Stroke: Reicon's own (1.5). `strokeWidth` is ignored on purpose: a
  custom stroke makes Reicon render an extra SVG mask for every icon.
- Custom glyphs: `viewBox="0 0 16 16"`, `fill="currentColor"` (or
  `stroke="currentColor" strokeWidth="1.5"`, which is lucide's 2 on a 24
  grid), `aria-hidden`, base class `size-4 shrink-0`, cut-outs with
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
  (`reicon-react/icons/<Name>`), so only the icons the app uses are
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
- `strokeWidth={1.5}` on a lucide icon to make it "lighter".
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
Reicon through `@/components/icons` (all `lucide-react` imports repointed,
the animated icon files removed, `Ri*Fill` now Filled).

Nothing below is changed yet.

**Ri\* aliases** (`src/shared/ui/lucide-icons.tsx`, 124 importing files):
Remixicon names kept from the old kit, pointing at lucide icons. Codemod
them to lucide names from `@/components/icons` over time, then delete the
file. Misleading ones to fix first: `RiStarFill`, `RiCheckboxCircleFill`,
`RiEyeFill`, `RiEyeOffFill`, `RiHeartFill`, `RiCalendar2Fill`,
`RiLoader2Fill` (all outline, not filled); `RiGoogleFill` → `Chrome`,
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
