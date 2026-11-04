# Icons

Every icon in the app: where it comes from, its size in each context, color,
stroke, labels, and the app's own glyphs (status, stage, priority, app icon).
Live examples: **/ui** → Icons.

## Use

| Need                                | Use                                                       | File                                                     |
| ----------------------------------- | --------------------------------------------------------- | -------------------------------------------------------- |
| An icon (default)                   | `import { Bell } from "@/components/icons"` (lucide name) | `src/components/icons/index.ts`                          |
| An icon that set doesn't have       | `lucide-react` (static)                                   | —                                                        |
| Icons in always-loaded root UI      | `lucide-react` (keeps motion off first load)              | `src/components/ui/sonner.tsx`, `ui/spinner.tsx`         |
| Existing `Ri*` names (legacy)       | `@/shared/ui/lucide-icons` (aliases to the above)         | `src/shared/ui/lucide-icons.tsx`                         |
| Project status (Planned … Archived) | `ProjectStatusIcon status`                                | `src/page-slices/projects/ui/ProjectStatusIcon.tsx`      |
| Project stage (branding/design/dev) | `ProjectStageIcon stage`                                  | `src/page-slices/projects/ui/ProjectStageIcon.tsx`       |
| Task priority                       | `TaskPriorityIcon priority`                               | `src/page-slices/projects/ui/workspace/TaskPriority.tsx` |
| Leave request status                | `LeaveStatusIcon status`                                  | `src/page-slices/leave/ui/components/StatusIcon.tsx`     |
| Notification kinds (filled)         | `BellFilled`, `CalendarCheckFilled`, …                    | `src/widgets/notifications/ui/notification-icons.tsx`    |
| The Kretya app icon / mark          | `AppIcon size variant`                                    | `src/components/app-icon.tsx`                            |
| A project's letter tile             | `ProjectAvatar id name`                                   | `src/components/project-avatar.tsx`                      |
| Loading                             | `Spinner` (not an icon + `animate-spin`)                  | `src/components/ui/spinner.tsx`                          |

`@/components/icons` is [lucide-animated](https://lucide-animated.com)
adapted to the lucide-react API (`className`, `size`, `strokeWidth`, aria
props). Each icon plays its animation when its nearest interactive parent
(button, link, menu item, tab, sidebar item) is hovered or keyboard-focused;
`standalone` plays it on the icon's own hover. Adding one: download the
registry JSON into `src/components/icons/<name>.tsx`, add
`export const Name = animated(NameIconSource, "Name")` to `index.ts`; icons
the registry lacks are drawn in `icons/extra.tsx`.

## Rules

**Source**

- New code imports by lucide name from `@/components/icons`; if the icon
  isn't there, from `lucide-react`. Don't add new `Ri*` aliases, and don't
  import the same icon from two sources in one file.
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
- Stroke 2 (lucide default). Don't pass `strokeWidth`, except a check in a
  tiny filled box (`strokeWidth={3}`, `brief-ui.tsx`).
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

- The animated set pulls `motion`: keep it out of the root layout and
  primitives that every page loads (`sonner.tsx`, `spinner.tsx` use static
  lucide on purpose).
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

**`lucide-react` imports of icons the animated set has** (move to
`@/components/icons`; keep `sonner.tsx`, `spinner.tsx`, `checkbox.tsx`,
`breadcrumb.tsx`, `pagination.tsx` static):

- `Trash2` → `Delete`, `Pencil` → `SquarePen`, `Settings2` →
  `SlidersHorizontal`, `CheckCircle2` → `CircleCheck`, `LogOut` → `Logout`:
  `AdminAttendanceHistoryList.tsx:38`, `AttendanceHistoryList.tsx:33`,
  `data-table-bulk-editor.tsx:7`, `ClientsPage.tsx:27`,
  `ContractsPage.tsx:44`, `SubscriptionsTab.tsx:13`,
  `leave-context-menu.tsx:14`, `PaymentMethodsPage.tsx:32`,
  `CompetencyLibrary.tsx:12`, `OneOnOne.tsx:32`, `PoliciesPage.tsx:11`,
  `doc-context-menu.tsx:17`, `ProcessEditorPage.tsx:37`,
  `ProcessesPage.tsx:11`, `CategoryPicker.tsx:23`, `ProjectMenu.tsx:28`,
  `InvoiceEditorDialog.tsx:82`, `MyNotesPage.tsx:41`, `DesignLinks.tsx:20`,
  `PhaseRail.tsx:29`, `ProjectDashboard.tsx:90`, `ProjectDocuments.tsx:35`,
  `ProjectInvoices.tsx:38`, `ProjectLibrary.tsx:48`, `report-menu.tsx:8`,
  `task-menu.tsx:14`, `SantuyPage.tsx:42`, `MembersAccessSettings.tsx:63`,
  `WhatsNewEditor.tsx:30`, `WhatsNewPage.tsx:32`, `calendar-menu.tsx:30`,
  `MenubarPopover.tsx:40`, `ClockControls.tsx:38`.
- Same name, static copy: `callout-box.tsx:3`, `embed-block.tsx:11`,
  `empty-state.tsx:2` (`Inbox`), `floating-tab-bar.tsx:10`,
  `gallery-strip.tsx:6`, `image-lightbox.tsx:6`, `mac-download.tsx:22`,
  `markdown.tsx:22`, `nav-user.tsx:32`, `sidebar-notices.tsx:18`,
  `app-sidebar.tsx:59`, `ProjectTimeline.tsx:28`, `AdminDashboard.tsx:20`,
  `EmployeeProjectsWidget.tsx:18`, the `briefs/ui/*` files
  (`BriefBuilder.tsx:59`, `BriefForm.tsx:29`, …), `portal/*`
  (`PortalDocuments.tsx:13`, `PortalLibrary.tsx:12`, `PortalOverview.tsx:10`),
  `ProjectStatusIcon.tsx:2` (`Archive`), `StatusIcon.tsx:2`,
  `generic-items.ts:3`, `ContextMenuProvider.tsx:22`,
  `NotificationsPanel.tsx:35`, `SettingsDialog.tsx:63`,
  `WhatsNewDialog.tsx:21`, and the rest of `page-slices/projects` /
  `policies` listed by `grep -rn 'from "lucide-react"' src`.
  Decide per file whether hover animation is wanted (menus and data
  configs may stay static); the rule is one source per file.

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

**Stroke**: `ProjectProperties.tsx:42` (`strokeWidth="1.5"` on a 14px
viewBox) → 16px viewBox like the other glyphs.

**Adapter**: `src/components/icons/animated.tsx:64` ignores the forwarded
ref (`_ref`), so `ref` on an animated icon is silently dropped → forward it
to the wrapper `span` or the svg.
