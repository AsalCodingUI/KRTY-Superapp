# Radius

Corner radii: the scale, which element gets which, squircle corners, nested
(concentric) radii, and the Mac app. Live examples: **/ui** → Radius.

## Use

| Need                                        | Use                                                                      | File                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| A corner on anything                        | A scale class: `rounded-sm` … `rounded-3xl`, `rounded-full`              | tokens in `src/app/globals.css` (`@theme inline`)                |
| A container whose children are rounded      | `nest-rounded-<step> nest-p-<n>` on it, `rounded-nested` on the children | `globals.css` (`nest-rounded-*`, `nest-p-*`, `rounded-nested`)   |
| The card surface                            | `surfaceClassName` / `Panel` / `HomeCard`                                | `src/components/panel.tsx`, `dashboard/components/home-card.tsx` |
| An app-icon shape (smooth in every browser) | `squircle-mask`                                                          | `globals.css`                                                    |
| A child that follows its parent's corner    | `rounded-[inherit]` (corner-shape inherits too)                          | e.g. `GlassLayer`, `scroll-area.tsx`                             |

## The scale

Everything derives from `--radius: 0.625rem` (10px):

| Class          | Token          | Round | Squircle (×1.715) | For                                         |
| -------------- | -------------- | ----- | ----------------- | ------------------------------------------- |
| `rounded-sm`   | `--radius-sm`  | 6px   | 10.3px            | Kbd, count chips                            |
| `rounded-md`   | `--radius-md`  | 8px   | 13.7px            | ListChip, Textarea, Tooltip, Skeleton       |
| `rounded-lg`   | `--radius-lg`  | 10px  | 17.2px            | Row highlight, list/group pills, menu items |
| `rounded-xl`   | `--radius-xl`  | 14px  | 24px              | Cards, thumbnails, framed panes             |
| `rounded-2xl`  | `--radius-2xl` | 18px  | 30.9px            | Popover, menu, select, toast, command       |
| `rounded-3xl`  | `--radius-3xl` | 22px  | 37.7px            | Dialog, drawer, page sheet                  |
| `rounded-full` | —              | pill  | never squircled   | Buttons, fields, badges, avatars, tabs      |

`rounded-4xl` (26px) exists but is unused. Bare `rounded` is a plain 4px and
is not squircled (see below).

## Squircle corners

`postcss/smooth-corners.cjs` (vendored postcss-smooth-corners, wired in
`postcss.config.mjs`) adds `corner-shape: squircle` to every
`border-radius` of **5px or more**, and where the browser supports it
(`@supports (corner-shape: squircle)`) multiplies the radius by **1.715**
so the squircle cuts the same area as the round corner it replaces.

- It can't scale values inside `var()`, so it scales the tokens instead:
  `--radius` (1.072rem under support) and `--nest-r`. Every `rounded-*`
  step follows.
- Arbitrary values are scaled too: `rounded-[24px]` becomes 41px.
- Never touched: `rounded-full` (pills stay pills), radii under 5px
  (`rounded`, `rounded-[2px]`, `rounded-[4px]`), the calendar
  (`.rdp-root` is forced to `corner-shape: round` so day circles stay round).
- `--corner-k` on `:root` is the factor in use: `1.715` with support, `1`
  without. Anything that does radius math must multiply by it.
- Without support (Safari and the Mac app's WebKit today) corners are
  plain round at the unscaled value. Check both.

## Nested radius

Concentric corners: inner radius = outer radius − padding, so curves stay
parallel. The container sets it once; children follow.

```tsx
<div className="nest-rounded-2xl nest-p-2">
  {" "}
  {/* 18px, 8px padding */}
  <button className="rounded-nested">…</button> {/* 18 − 8 = 10px */}
</div>
```

- `nest-rounded-<step|[len]>` sets `--nest-r` and the container's radius.
- `nest-p-<n>` sets `--nest-p` and the padding. When the gap isn't the
  container's padding (padding on an inner list, or two paddings stacked),
  set `[--nest-p:…]` directly to the total distance.
- `rounded-nested` = `max(--nest-min (4px), --nest-r − --nest-p × --corner-k)`.
  The 4px floor keeps tight paddings from squaring the corner.
- On a component that already sets `rounded-*` / `p-*`, pass both
  (`rounded-2xl p-2 nest-rounded-2xl nest-p-2`) so the class merger replaces
  the component's own.
- Built in: `DropdownMenuContent`, `SelectContent` (list `p-1` inside
  `nest-p-2` → `[--nest-p:12px]` → 6px items), `Command`
  (`[--nest-p:12px]`), right `SheetContent` (`--nest-r: 3xl`, `--nest-p:
8px` → 14px, concentric with the page sheet), `ContextMenuProvider`,
  `rich-text-field.tsx` mention menu, the notes side panel
  (`MyNotesPage` `lg:rounded-nested`).

## Which element gets which

| Element                                                         | Radius                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Button (all sizes, icon buttons), Toggle                        | `rounded-full`                                                            |
| Input, Select trigger, InputGroup                               | `rounded-full`                                                            |
| Textarea (multi-line)                                           | `rounded-md`                                                              |
| Badge (status)                                                  | `rounded-full`                                                            |
| ListChip (row metadata)                                         | `rounded-md`                                                              |
| Kbd, tab count chip                                             | `rounded-sm`                                                              |
| Checkbox                                                        | `rounded-[5px]` (component constant)                                      |
| Avatar, avatar group, Switch, Slider, Progress                  | `rounded-full`                                                            |
| ProjectAvatar (color square)                                    | `rounded-[5px]` (component)                                               |
| Tabs list + thumb, SegmentedControl                             | `rounded-full`                                                            |
| Row hover / selected highlight                                  | `rounded-lg`                                                              |
| List header / group header pill                                 | `rounded-lg`                                                              |
| Menu / select / command item                                    | `rounded-nested` (10px / 6px)                                             |
| Tooltip                                                         | `rounded-md`                                                              |
| Card (`surfaceClassName`, HomeCard, Panel)                      | `rounded-xl`                                                              |
| File / image thumbnail                                          | `rounded-xl ring-1 ring-border/60`                                        |
| Popover, dropdown, select popup, hover card, toast              | `rounded-2xl` / `nest-rounded-2xl nest-p-2`                               |
| Dialog, alert dialog, drawer                                    | `rounded-3xl`                                                             |
| Dialog as a phone sheet                                         | `max-sm:rounded-t-[28px] rounded-b-none` (`dialogSheetOnMobileClassName`) |
| Right sheet / side panel                                        | `rounded-nested` in the page sheet (14px; Mac 4px)                        |
| Page sheet (web, md+)                                           | `md:rounded-md` (small, Fibery-like)                                      |
| Page sheet (phone)                                              | `max-md:rounded-t-3xl`                                                    |
| Page sheet (Mac app, md+)                                       | `md:rounded-[10px]`                                                       |
| Minimal-screen glass card                                       | `rounded-[24px]` (`MinimalCard`)                                          |
| Printed paper (invoice, PDF/docx page)                          | `rounded-[4px]` (not squircled)                                           |

## Mac app (KRTY for Mac)

`src/app/(main)/layout.tsx` adds `DESKTOP_CSS` when the desktop-shell
cookie says `mac` (Windows keeps the web's):

- The page sheet sits 6px in from the window on web and Mac (`md:pr-1.5 md:pb-1.5`)
  with `md:rounded-[10px]`: the macOS window corner is 16pt, 16 − 6 = 10,
  the nested rule applied to the window itself.
- Right sheets (from md) and `[data-slot="side-panel"]` (from lg) sit
  `right/bottom: 14px` (6 + 8) with `--nest-r: calc(10px * --corner-k)`;
  `rounded-nested` then floors at 4px.
- The shadow layer under the page sheet switches radius with it.

## Role tokens (use these)

One radius per kind of element, defined in `src/app/globals.css`
(`--radius-*` roles derive from `--radius`, so they are squircled with
the rest; `rounded-control` and `rounded-tile` are plain utilities).
Measured on /ui → Radius (squircle browsers, ×1.715):

| Class             | Base       | Renders              | For                                                                           |
| ----------------- | ---------- | -------------------- | ----------------------------------------------------------------------------- |
| `rounded-control` | pill       | pill (not squircled) | buttons, inputs, selects, badges, tabs, toggles, segmented (sidebar rows and the Kantor / Project switch: `rounded-lg`, `SegmentedControl shape="row"`) |
| `rounded-chip`    | md (8px)   | 13.7px               | ListChip, textarea, tooltip                                                   |
| `rounded-row`     | lg (10px)  | 17.2px               | row highlight, column / group header pills                                    |
| `rounded-card`    | xl (14px)  | 24.0px               | cards, panels, HomeCard, embeds                                               |
| `rounded-popover` | 2xl (18px) | 30.9px               | popovers, menus, select, context menu, toasts                                 |
| `rounded-dialog`  | 3xl (22px) | 37.7px               | dialogs, sheets, page sheet, glass card, phone sheet top (`rounded-t-dialog`) |
| `rounded-tile`    | 25%        | 42.9%                | project squares, app icons: the corner follows the size                       |

- Menus: `nest-rounded-popover nest-p-2` on the menu, `rounded-nested` on
  items. Under squircles the inner radius is outer − padding × 1.715
  (measured: 30.9 − 8 × 1.715 = 17.2px = the item's).
- Mac app page sheet: `MAC_SHEET_RADIUS` in `src/app/(main)/layout.tsx`
  (10px, the native window corner less the inset), not a role.
- **New roles must be registered in `src/lib/utils.ts`** (the `rounded`
  groups of `createCn`), or `cn()` keeps both radii.
- `ProjectAvatar` owns its radius (`rounded-tile`): don't pass a radius.

## Rules

- Use a scale step. A new arbitrary radius needs a reason (a printed page,
  a native window corner) written next to it.
- One radius per element type (table above). Same element, same radius,
  on every page.
- Single-line controls are pills; multi-line fields and small labels are
  `rounded-md`.
- Anything rounded inside a padded rounded container uses the nested
  rule, never the same radius as its parent.
- Children that fill a rounded parent use `rounded-[inherit]` (or
  `overflow-hidden` on the parent), not a copied value.
- Radius math in CSS multiplies padding by `--corner-k`.

## Don't

- `rounded-2xl` items inside a `rounded-2xl p-2` menu (corners collide);
  use `nest-rounded-2xl nest-p-2` + `rounded-nested`.
- `rounded-[24px]`, `rounded-[12px]`, `rounded-[9px]` or other in-between
  values on new UI.
- `rounded-full` on a card or a multi-line box, or a square button.
- Copying `bg-card border… rounded-xl border` into a page; import
  `surfaceClassName` or use `Panel` / `HomeCard`.
- `corner-shape` or radius tweaks per page.

## Not on the scale (keep their own)

Calendar day circles (`.rdp-root`, round), chart legend dots and the
tooltip arrow (`rounded-[2px]`), printed invoice parts
(`InvoiceDocument`, `rounded-[2px]`), docx / PDF pages (4px), the Mac
page sheet (10px), the app icon (`squircle-mask`).

## Good examples

- Nested menu: `src/components/ui/dropdown-menu.tsx`
- Concentric sheet: `src/components/ui/sheet.tsx` (right side)
- Card surface: `src/components/panel.tsx` (`surfaceClassName`)
- Pills: `src/components/ui/button.tsx`, `src/components/ui/input.tsx`

## Example

```tsx
<div className="bg-popover nest-rounded-2xl nest-p-2 shadow-(--elev-4)">
  {items.map((i) => (
    <button
      key={i.id}
      className="rounded-nested hover:bg-accent flex min-h-8 w-full items-center gap-2 px-2 text-sm"
    >
      {i.label}
    </button>
  ))}
</div>
```

## Migration notes

Done 2026-11-05 (local): the role tokens above applied in the shared
components (dialog, sheet, popover, dropdown, select, hover card,
command, context menu, toast, card surfaces, HomeCard, grouped list,
sliding highlight, chip, tooltip, textarea, button, input, select,
badge, tabs, input group, toggle, segmented control; sidebar rows are
10px `rounded-lg`, like the Settings nav, see navigation.md);
bordered `rounded-2xl` cards → `rounded-card`; glass cards and phone
sheet tops → dialog; date picker and brief menus → popover; mention /
slash / rich-text / brief menus on the nested standard; `ProjectAvatar`
and app icons on `rounded-tile` (12 call-site overrides removed); the
Mac page radius one constant; `rounded-4xl` removed. The older list
below is kept for reference.

Current inconsistencies, and what they should become:

- **Off-scale glass card**: `src/components/minimal-screen.tsx:87` and
  `src/app/(fullscreen)/r/[token]/page.tsx:147` `rounded-[24px]` (41px
  under squircle) → `rounded-3xl`, matching dialogs.
- **Phone sheet top** has three values: `max-md:rounded-t-3xl` (page sheet,
  `src/app/(main)/layout.tsx:135`), `rounded-t-[28px]`
  (`src/components/ui/dialog-sections.tsx:13`,
  `src/page-slices/projects/ui/portal/PortalShell.tsx:223`) and
  `rounded-t-[24px]` (`src/widgets/event-calendar/ui/month-view.tsx:33`)
  → one value (`rounded-t-3xl`), ideally a shared constant.
- **Menus off the nested standard** (`nest-rounded-2xl nest-p-2`):
  `src/page-slices/policies/ui/mention.tsx:538` (`nest-rounded-xl nest-p-1`),
  `src/page-slices/policies/ui/slash-command.tsx:305`
  (`nest-rounded-xl nest-p-1.5`), `src/components/rich-text-field.tsx:358`
  (`nest-p-1.5`), `src/page-slices/briefs/ui/BriefBuilder.tsx:620`
  (`rounded-2xl p-1.5`, items not nested).
- **Popovers not on `rounded-2xl`**: `src/components/date-picker.tsx:234`
  (`rounded-xl`), `src/page-slices/briefs/ui/BriefBuilder.tsx:564`
  (`rounded-xl`), chart tooltip `src/page-slices/finance/ui/OverviewTab.tsx:235`
  (`rounded-lg`; fine if it becomes the shared chart tooltip from
  `components/ui/chart.tsx`, which is `rounded-xl`).
- **Cards on `rounded-2xl`** instead of `rounded-xl`:
  `src/page-slices/performance/ui/review/ReviewResult.tsx:40,219,283,289`,
  `src/page-slices/contracts/ui/ContractDialog.tsx:257`,
  `src/page-slices/leave/ui/components/LeaveDetailsModal.tsx:191`,
  `src/page-slices/briefs/ui/BriefForm.tsx:651`,
  `src/page-slices/briefs/ui/shared.tsx:151`,
  `src/page-slices/policies/ui/ReleaseDownload.tsx:103`.
- **Copied card surface**: `src/page-slices/performance/ui/kpi/MyKpiView.tsx:48`
  repeats `surfaceClassName` → import it from `components/panel.tsx`.
  Grid cards in `ClientsPage.tsx:461`, `ProcessesPage.tsx:202`,
  `PoliciesPage.tsx:523` use `border-foreground/10` instead of the
  surface's `border-field-border` (one card border).
- **`rounded-[12px]`**: `src/components/embed-block.tsx:132` → `rounded-xl`.
- **App icon radii**: `rounded-[15px]` (`minimal-screen.tsx:100`
  `screenLogoClass`, `src/app/(fullscreen)/b/[token]/page.tsx:88`) and
  `rounded-[12px]` (`r/[token]/page.tsx:130`) → `squircle-mask` (or one
  radius ratio inside `AppIcon`).
- **Project color square** is `rounded-[5px]` at every size (16px to 36px):
  `src/components/project-avatar.tsx:72` plus hand copies in
  `src/components/nav-project.tsx:91`,
  `src/page-slices/projects/ui/workspace/ProjectSettings.tsx:144` (size-9),
  `ProjectDashboard.tsx:375` (size-7),
  `src/page-slices/projects/ui/portal/PortalShell.tsx:148`
  (`max-md:rounded-[9px]`), `SubscriptionsTab.tsx:513`,
  `src/app/(main)/calendar/ProjectTimeline.tsx:237`. → a `size` prop on
  `ProjectAvatar` that picks the radius (~ size/4), used everywhere.
- **Sidebar labels**: `src/components/ui/sidebar.tsx:502,711` `rounded-xl`
  on 32px-tall items while menu buttons (`:577`) are `rounded-full` → pills.
- **Mac page radius** lives in two places (`md:rounded-[10px]` twice in
  `layout.tsx:123,132` and `CORNER` in `DESKTOP_CSS`), and
  `PortalShell.tsx:219,223` copies the web page-sheet classes without the
  Mac variant → one shared page-sheet class / `--page-r` token.
- `rounded-4xl` is defined but unused; drop it or give it a role.
