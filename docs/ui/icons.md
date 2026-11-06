# Icons

Every icon in the app: where it comes from, its size in each context, color,
stroke, labels, and the app's own glyphs (status, stage, priority, app icon).
Live examples: **/ui** → Icons.

## Use

| Need                          | Use                                                                                                                                                                                            | File                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Any icon                      | `import { Bell } from "@/components/icons"` (app names, lucide-style)                                                                                                                          | `src/components/icons/index.tsx`          |
| An icon not in the list yet   | pick its base on /icon-lab (the Untitled pack), draw ours in `set/` or `custom.tsx` (`glyph(name, d)`, 24px grid, 1.5 stroke), then `export const Name = icon(K.Glyph, "Name")` in `index.tsx` | `src/components/icons/set/`, `custom.tsx` |
| Existing `Ri*` names (legacy) | `@/shared/ui/lucide-icons` (aliases to the above)                                                                                                                                              | `src/shared/ui/lucide-icons.tsx`          |
| Loading                       | `Spinner` (not an icon + `animate-spin`)                                                                                                                                                       | `src/components/ui/spinner.tsx`           |

The icon set is **our own** (`src/components/icons/set/` and
`custom.tsx`): every icon the app uses, redrawn on a 24px grid with a 1.5
stroke, round caps and joins and soft corners, using the Untitled UI line
set only as the base (what each icon shows and how it's composed; the
paths are ours). `index.tsx` maps the app's icon names onto it, so pages
never import a glyph file themselves. `@untitledui/icons` stays a
dependency only for /icon-lab, which shows each base beside ours. Where
the base didn't match the app's meaning, `custom.tsx` draws it directly
(`CircleDot`, `CircleDashed`, `ListOrdered`, `Coffee`, the six-dot
grips). There is no filled set: `weight`
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
- Grid and stroke: every glyph is drawn on a **24px grid with a 1.5px
  stroke** (`STROKE` in `src/components/icons/custom.tsx`), round caps and
  joins. The stroke **scales** with the icon: 1px at `size-4`, 0.875 at
  `size-3.5`, 2px at 32px. Every size is the same drawing, only bigger or
  smaller. `strokeWidth` on a single icon is ignored.
- Our own set: redrawn from the Untitled UI base on that grid, in
  `custom.tsx`; /icon-lab shows the whole Untitled pack, which ones the
  app uses (darker tile) and which are redrawn (dot; hover shows the
  Untitled original).
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
set removed), then a fixed 1.4px stroke (optical balance).

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

## Drawing rules (our set)

Every glyph in `src/components/icons/set/` and `custom.tsx` follows these.
Check new ones against them and against /icon-lab (hover shows the base).

1. **Grid and stroke.** 24 × 24, stroke 1.5 (it scales with the icon),
   round caps and joins, outline only. Live area 3–21 (2px padding; 3.5
   for compact shapes). Circles r 8.5 at 12,12 (they read as big as an
   18px square).
2. **Corners.** Containers (cards, files, folders, calendars, bubbles)
   r 3; boxes 6–10px wide r 2; tiny boxes r 1. Polygon and roof corners
   round with r 1.5, all the same within an icon (no mix of sharp and
   soft corners, no lumpy joins).
3. **Nested corners.** A rounded shape inside a rounded shape keeps an
   even gap: inner r = outer r − gap (gap between stroke centres), never
   below 1. No square inside a round or the other way round. Exception: `StopCircle` keeps a
   rounded square (6.5, r 2) inside the circle, the conventional stop mark.
4. **Cuts.** Where one stroke crosses another and the other is broken (a
   slash through wifi, an eye, a bell), the gap is 1.5 between stroke
   edges on both sides (cut ends 2.25 from the crossing stroke's centre),
   the same everywhere in the set.
5. **Dashes and dots.** A dashed outline uses one dash length and one gap
   all round, placed symmetrically (corners and axis midpoints match).
   Dots are round-capped zero-length segments (`h.01`) on the same pitch.
   Never mix dashes and dots in one outline.
6. **Air.** Separate parts (a rocket's fins and body, a badge on a file)
   are 1.5 apart or more, so nothing fuses into a solid blob at 16px.
7. **Simple.** One idea per icon, at most 3–4 inner details, nothing
   smaller than 2px. Gears have 6 teeth and a 2.5 hub. Prefer the plainer
   form when the base is busy.
8. **Ours, not a trace.** Keep what the base shows and roughly where, but
   change the drawing: our proportions, corners, simplification. If ours
   is hard to tell from the base at 64px, redraw it.
9. **Family.** Reuse exact sub-shapes: one arrowhead (legs 5.75), one
   chevron (5 × 5), one X (`M6.75 6.75l10.5 10.5M17.25 6.75l-10.5 10.5`),
   one plus, one check, one person, one file outline, one folder, one
   calendar body, one circle, one square (3.5–20.5, r 3).
