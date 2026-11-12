# Color

The color system: semantic tokens, the 12-step palettes behind them,
light / dark / dark chrome, the viewer's tint, status, rows, charts and
project colors. Live swatches: **/ui** → Color.

## Use

| Need                                | Use                                                                      | File                                          |
| ----------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| Any color in a component            | A semantic token class (`bg-background`, `text-muted-foreground`, …)     | `src/app/globals.css` (`:root`, `.dark`)      |
| A hue the tokens don't name         | Palette step `bg-pink-9`, `text-teal-11`, `bg-blue-3`                    | `src/app/palette.css`                         |
| Status pill                         | `Badge variant="success \| warning \| info \| destructive \| secondary"` | `src/components/ui/badge.tsx`                 |
| Tinted note box                     | `CalloutBox tone` / `CALLOUT_STYLE`                                      | `src/components/callout-box.tsx`              |
| A project's own color               | `ProjectAvatar`, `projectColor(id)`, `projectColorVar(id)`               | `src/components/project-avatar.tsx`           |
| Calendar event color                | `EVENT_TONE[color]`                                                      | `src/widgets/event-calendar/ui/event-tone.ts` |
| Series in a chart                   | `chartColors` / `getColorClassName`                                      | `src/shared/lib/chart/utils.ts`               |
| Card surface (bg + border + radius) | `surfaceClassName`                                                       | `src/components/panel.tsx`                    |
| Row hover / selected                | `GroupedList` / DataTable (`--row-hover`, `--row-selected`)              | see [table.md](table.md)                      |
| Always-dark screen (sign-in)        | `AlwaysDark`                                                             | `src/components/always-dark.tsx`              |

## How it works

- **Tokens** live in `src/app/globals.css`: values in `:root` (light) and
  `.dark`, exposed to Tailwind in `@theme inline` as `--color-*`, so every
  token is a class: `bg-muted`, `text-tertiary-foreground`,
  `border-field-border`, `ring-focus-ring`. Tokens without a class (rows,
  elevation) are used as `bg-(--row-hover)`, `shadow-(--elev-3)`.
- **Palettes** (`src/app/palette.css`): 14 Radix-style 12-step scales in
  oklch: blue, red, green, yellow, amber, orange, tomato, pink, purple,
  indigo, teal, cyan, mint, lime. Steps: 1–2 app bg, 3–5 component bg
  (hover/active), 6–8 borders, **9 solid**, 10 solid hover, **11 text**,
  12 high-contrast text. In `.dark` steps 1–8 become step 9 see-through,
  so tints sit right on any dark surface.
- **Tint**: the viewer's theme color (Settings → Tampilan) sets
  `--tint-h` (hue) and `--tint-c` (0–1) on `<html>` (`ChromeTint`,
  `src/shared/lib/chrome-tint.ts`). Ink, chrome, primary and shadows
  lean toward it. **Fills never do**: the page, cards, popovers,
  buttons, hovers and other fills are plain white / neutral gray (graphite
  in dark) in every theme. Never read the tint yourself: use the tokens.
- **Light / dark**: `next-themes` toggles `.dark` on `<html>`. **Dark
  chrome** (dark sidebar in light mode): `<html data-dark-chrome>` +
  `data-chrome-dark` on the sidebar and top bar; the `dark:` variant and
  the dark tokens apply inside them only (globals.css `@custom-variant dark`).
  Write `dark:` once; it covers both.

## Tokens

**Surfaces**

| Token                  | For                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `background`           | The page (plain white; neutral graphite in dark), whatever the tint                            |
| `card`                 | Cards (same as page in light, lifted in dark)                                                   |
| `popover`              | Menus, popovers, dialogs (pure white in light)                                                  |
| `surface`              | Dark only: the main page pane and sticky cells on it (`dark:bg-surface`); = background in light |
| `chrome`               | Sidebar + top bar (#F6F6F6 neutral, tinted); `chrome-hover`, `chrome-active` (white 90%), `chrome-field` (black 6%), `chrome-selected` = the active row (black 5%, white 11% dark) |
| `muted`                | Quiet fill (see-through 3.5% ink): pills, column labels, chips                                  |
| `muted-solid`          | Opaque `muted`, for sticky cells over scrolling content                                         |
| `secondary`, `accent`  | Secondary button fill; hover/active of menu items and ghost buttons                             |
| `field`, `field-hover` | Inputs, selects, textareas                                                                      |
| `thumb`                | Active thumb of segmented / tabs / toggles                                                      |
| `inverse`              | Near-black floating bar on any page (DataTable bulk editor), white text                         |
| `backdrop`             | Behind dialogs                                                                                  |

**Text** (by role, see [typography.md](typography.md))

| Token                                            | For                                         |
| ------------------------------------------------ | ------------------------------------------- |
| `heading`                                        | Titles (= foreground today)                 |
| `foreground`                                     | Body text, values                           |
| `muted-foreground`                               | Secondary text, descriptions, icons in rows |
| `tertiary-foreground`                            | Meta, counts, quiet hints, empty value      |
| `secondary-foreground`                           | Text on outline / secondary buttons         |
| `primary-foreground`, `destructive-foreground` … | Text on that solid fill                     |

**Borders and focus**

| Token                | For                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| `border` (default)   | Hairlines: card edges in dark, panel headers, separators. `*` already has `border-border`            |
| `field-border`       | Edge of fields and outline buttons: the hairline's tone (`--border`), one border everywhere; transparent in dark |
| `field-border-hover` | Their hover                                                                                          |
| `input`              | Fills of tracks (slider, radio, button-group divider)                                                |
| `focus-ring`         | Focus halo: `focus-visible:ring-2 focus-visible:ring-focus-ring` + `focus-visible:border-primary/50` |
| `ring`               | Default outline (`outline-ring/50` on `*`), sidebar ring                                             |
| `sidebar-border`     | Lines inside the sidebar                                                                             |

**Brand and status**

| Token                                        | Solid (fill, icon) | Subtle (badge bg)       | Text on subtle                                       |
| -------------------------------------------- | ------------------ | ----------------------- | ---------------------------------------------------- |
| `primary` (blue-9, or the tint's deep shade) | `bg-primary`       | `bg-primary/14`         | `text-primary-ink`                                   |
| `success` (green-9)                          | `bg-success`       | `bg-success-subtle`     | `text-green-11` (text elsewhere: `text-success-ink`) |
| `warning` (amber-9)                          | `bg-warning`       | `bg-warning-subtle`     | `text-amber-11`                                      |
| `info` (blue-9)                              | `bg-info`          | `bg-info-subtle`        | `text-blue-11`                                       |
| `destructive` (red-9)                        | `bg-destructive`   | `bg-destructive-subtle` | `text-red-11` (text elsewhere: `text-destructive`)   |
| `neutral`                                    | –                  | `bg-neutral-subtle`     | `text-neutral-ink`                                   |

`*-line` tokens (`success-line` …) are a light-mode outline for subtle
boxes; transparent in dark.

**Rows** (opaque, so cell edges never seam): `--row-surface`,
`--row-hover`, `--row-selected`. Used by GroupedList / DataTable only.

**Charts**: categorical series use `chartColors` (step-9 hues: primary,
green, purple, amber, gray, cyan, info, pink). `--chart-1…5` is a warm
yellow→brown ramp (sequential data only, e.g. a heat scale).

**Project colors**: `projectColor(id)` hashes the id (FNV-1a) to one of 14
step-9 fills (`bg-blue-9 text-white` …); `projectColorVar(id)` gives the
same as `var(--blue-9)` for inline tints (timeline bars). The tile is
made a touch more vivid inline (`oklch(from … )`). A project keeps its
color everywhere; don't pick one by index or name.

## Rules

**Pick in this order**

1. The component's own variant (`Badge`, `Button`, `CalloutBox`, `EmptyState`).
2. A semantic token (`text-muted-foreground`, `bg-muted`, `text-destructive`).
3. A palette step, when a hue is the point (event colors, charts, a
   category): `-9` for fills/dots, `-3` for tint backgrounds, `-11` for
   text on light. Never a Tailwind default color (`text-gray-500`,
   `bg-red-500`, `text-emerald-500`) and never hex / `rgb()` /
   `oklch()` in a class or `style`.

**Text colors**

- Gray text is `muted-foreground` or `tertiary-foreground`, nothing else
  (no `text-muted-foreground/60`, no `text-foreground/70`).
- Colored text reads on white only at step 11 (or the `-ink` tokens):
  warning text `text-amber-11`, success `text-success-ink`, info
  `text-blue-11`. Step 9 (`text-warning`, `text-info`) is for icons,
  dots and big numbers.
- On a solid fill use its `-foreground` (white on primary/destructive,
  dark on warning).

**Opacity modifiers**

- OK: a tint of a solid token where no subtle token exists
  (`bg-primary/10` for an active nav count, `bg-purple-9/12` event block,
  `bg-destructive/10` destructive button), focus halos
  (`ring-primary/15`), and `dark:bg-muted/40` on the pill (table.md).
- Not OK: dimming text grays (`text-muted-foreground/50`), lightening
  borders (`border-border/50`), or `bg-muted/50`: `muted` is already a
  3.5% see-through ink; use the token as is or `accent` for a stronger one.
- Prefer the subtle token over a hand-made tint for status
  (`bg-success-subtle`, not `bg-success/15`).

**Borders**

- Hairline: plain `border` (color comes from `*`). Fields and outline
  buttons: `border-field-border` with `hover:border-field-border-hover`.
  Cards: `surfaceClassName` (`border-border`: the same hairline as the
  dividers inside them, so a card's edge never reads heavier).
- No `border-foreground/10` style borders; they skip the tint and the dark
  variant.

**Dark mode**

- Most tokens switch by themselves; reach for `dark:` only for a real
  dark-only decision (`dark:bg-surface` for a lifted panel,
  `dark:bg-muted/40` for the pill, `dark:border-border` on cards).
- Don't write `dark:text-foreground` and the like: it is already that.
- Palette steps 1–8 are see-through in dark: a `bg-blue-3` chip shows the
  surface under it. Step 9 stays solid; step 11 is a light tint in dark.
- Test inside the dark sidebar too (Settings → Tampilan → dark sidebar),
  not only `.dark`.

**Chrome**

- On the sidebar / top bar: `.on-chrome` (muted text becomes see-through
  ink), fills `bg-chrome-field` / `bg-chrome-hover`, active pill
  `bg-chrome-active`, and the blend utilities (`blend-ink`, `blend-light`,
  `blend-shadow`, `banner-ink`, `fill-ink`) so the tint shows through.
  Black ink blends `plus-darker` (Safari; `darken` elsewhere), white ink
  and white thumbs `plus-lighter`, in every theme. Blend the ink (a row's
  icon and label), never a row holding a colored tile: project avatars
  keep their pure white letter.
- Nav labels on the chrome (sidebar rows, workspace tabs, app tabs):
  `text-chrome-label`: secondary when not active (black 72% in light, white
  80% in dark and under the dark sidebar), foreground on hover and when
  active; the sidebar rows' icons take the same color as their label.
- The page sheet (light) is `--paper`, pure `#fff` whatever the tint (set as `--background`
  inside `[data-paper]`, `page-sheet.tsx`). Cards (`--card`), fields
  (`--field`) and outline buttons (`bg-card`) on it are pure white.

**Focus and selection**

- Fields: `focus-visible:border-primary/50 focus-visible:ring-2
focus-visible:ring-focus-ring` (input, select, textarea). Invalid:
  `aria-invalid:border-destructive aria-invalid:ring-destructive/20`.
- Text selection: `selection:bg-primary/20 selection:text-primary` (set
  on `<body>`). Selected blocks in the editor: `bg-primary/[0.08]`.

**Light**

- Colors are CSS variables: switching theme or tint repaints without
  React work. Don't compute colors in JS (except `projectColor`, a hash).
- No gradients or blur behind scrolling content; the chrome gradient is
  painted once (`[data-slot="sidebar-wrapper"]`).

## Don't

- `text-gray-*`, `bg-zinc-*`, `text-red-500`, `text-emerald-500`, `text-neutral-700`.
- `bg-[#e5a000]`, `text-[#8C8C8C]`, `style={{ color: "#…" }}` in app UI.
- `text-warning` for a sentence (amber-9 on white fails contrast).
- `border-border/50`, `bg-muted/60`, `text-muted-foreground/40`.
- A new status color made from a palette when a status token exists.
- `text-white` on a surface token (it breaks in light); use the fill's
  `-foreground`. `text-white` is fine on photos, scrims, project tiles.

## Not tokens (keep their own colors)

Printed invoice (`InvoiceDocument`: fixed hex for print/PDF), brand logos
(Google, Figma SVGs), OG images and emails (`src/shared/og`,
`notification-email-html.ts`), image backdrops in `zoomable.tsx`, file
previews (paper is always white), `AlwaysDark` auth screens.

## Good examples

- Status variants: `src/components/ui/badge.tsx`
- Palette per tone, dark-aware: `src/components/callout-box.tsx`
- Hue as data: `src/widgets/event-calendar/ui/event-tone.ts`, `src/components/project-avatar.tsx`
- Fields and focus: `src/components/ui/input.tsx`

## Example

```tsx
<div className={cn(surfaceClassName, "flex flex-col gap-1 p-4")}>
  <span className="text-muted-foreground text-sm">Status</span>
  <Badge variant="warning">Menunggu</Badge>
  <p className="text-amber-11 text-[13px]">Belum disetujui atasan</p>
  <span className="bg-pink-9 size-2 rounded-full" aria-hidden />
</div>
```

## Status text: the ink tokens

Text in a status color uses the **`-ink`** token (palette step 11, made
for text on light and dark); the plain status color (step 9) is for
icons, dots, bars and fills. Measured contrast on the page background
(light / dark, WCAG AA = 4.5 for body text), from /ui → Color:

| Token                      | Light | Dark  | Was (step 9)                                                             |
| -------------------------- | ----- | ----- | ------------------------------------------------------------------------ |
| `text-warning-ink`         | 5.30  | 11.90 | `text-warning` 2.43 / 6.90                                               |
| `text-destructive-ink`     | 6.81  | 10.62 | `text-destructive` 3.56 / 4.68                                           |
| `text-success-ink`         | 6.63  | 10.66 | green-9 3.36 / 4.96                                                      |
| `text-info-ink`            | 6.76  | 10.50 | `text-info` (blue-9)                                                     |
| `text-foreground`          | 14.16 | 13.73 |                                                                          |
| `text-muted-foreground`    | 5.51  | 5.15  | 8.32 / 6.00 before the even text ladder (0.289 → 0.405 → 0.52 → 0.633)   |
| `text-tertiary-foreground` | 3.45  | 3.32  | below 4.5: keep it to meta / hints, never for the only copy of something |

Other tokens added: `--primary-hover` (`bg-primary-hover`, the primary
button's hover), `--primary-subtle` (`bg-primary-subtle`, theme tint).
Removed (unused): `--dialog-shell`, `--dialog-panel`, `--*-line`.

## Migration notes

Done 2026-11-05 (local): ink tokens for status text (warning ≈25
places, destructive 91, info, success); grays down to three steps (no
`text-*-foreground/NN`); `bg-muted/NN`, `border-border/NN`,
`border-foreground/NN` → plain tokens; one focus ring (`ring-focus-ring`)
on buttons, badges, switch, radio and pages; `--primary-hover`; event
tints on `-subtle` tokens; chart text keys on step 11 and the named
category colors fixed (blue was amber); stage icons, attendance split,
rating stars, review gradient, menubar and toggle off raw colors;
unused tokens removed. Open: `text-tertiary-foreground` contrast (3.45),
the `--chart-1…5` amber ramp for categorical data. The older list below
is kept for reference.

Audit (src, excluding `ui-docs`): `text-muted-foreground` 903,
`text-foreground` 371, `border-border` 177, `text-tertiary-foreground`
168, `text-destructive` 91, `shadow-(--elev-N)` 95, `bg-popover` 51,
`text-primary` 46, `bg-background` 46; Tailwind default palette in app UI 8
places; arbitrary hex classes ≈45 (40 in `InvoiceDocument`, exempt).

**Raw / default-palette colors**

- `projects/ui/ProjectStageIcon.tsx:9-11`: `text-fuchsia-500!`,
  `text-orange-500!`, `text-emerald-500!` → `text-pink-9`, `text-orange-9`,
  `text-green-9` (and drop the `!`).
- `policies/ui/ai-assist.tsx:893`: `text-amber-600 dark:text-amber-400` → `text-amber-11`.
- `briefs/ui/fields.tsx:294-295` (rating stars): `fill-amber-400
text-amber-400`, `hover:text-amber-300` → `fill-amber-9 text-amber-9`, `hover:text-amber-8`.
- `dashboard/components/attendance-split.tsx:25-27`: `bg-[#30a46c]`,
  `bg-[#e5a000] dark:bg-[#c08400]`, `bg-[#0090ff]` → `bg-success`,
  `bg-warning`, `bg-info`.
- `widgets/menubar/ui/MenubarPopover.tsx:529`: `bg-[oklch(0.34_0_0)]`,
  `bg-[oklch(0.29_0_0)]` → a token (`bg-muted-solid` / `bg-surface`).
- `performance/ui/review/ReviewResult.tsx:65-66`: gradient stops
  `#a855f7` → `#3b82f6` → `var(--purple-9)` → `var(--blue-9)`.
- `components/minimal-screen.tsx:47`, `empty-state.tsx:50-51`:
  `dark:bg-[color-mix(…)]` one-offs → a token if they repeat.
- `components/ui/button.tsx:11,15`: hover mixes in a class
  (`color-mix(in_oklch,var(--primary),white_12%)`) → a `--primary-hover` token.

**Off-token text colors**

- Warning text with `text-warning` (≈25 sentences/labels, e.g.
  `attendance/components/AttendanceHistoryList.tsx:357`,
  `AdminAttendanceHistoryList.tsx:455`, `finance/ui/OverviewTab.tsx:437`,
  `projects/ui/my-tasks/MyTasksPage.tsx:566`, `workspace/TaskBoard.tsx:638`,
  `invoice/InvoiceEditorDialog.tsx:1170`, `performance/ui/kpi/ProjectScoringView.tsx:317`,
  `MyKpiView.tsx:423`, `widgets/notifications/ui/NotificationsPanel.tsx:442`,
  `event-calendar/ui/event-tone.ts:49,54`, `event-color-registry.ts:100,112,231,238`)
  → add `--warning-ink` (amber-11 light / amber-10 dark, like
  `--success-ink`) and use `text-warning-ink`; icons keep `text-warning`.
- Same for `text-info` as event title text (`event-tone.ts:24`,
  `event-color-registry.ts:137`) → `text-blue-11`.
- `chartColors` text keys at step 9 (`shared/lib/chart/utils.ts:22,28,40,52`:
  `text-purple-9`, `text-amber-9`, `text-cyan-9`, `text-pink-9`) → step 11.
- `text-muted-foreground/40…/80`, `text-foreground/60…/80` as grays
  (≈45 uses; e.g. `entities/user/ui/UserCard.tsx:55`, `components/tab-navigation.tsx:125`,
  `components/ui/tabs.tsx:80`, `components/ui/badge.tsx:16`,
  `components/nav-main.tsx:45`, `segmented-control.tsx:85,89`,
  `projects/ui/workspace/TaskPriority.tsx:74`) → `text-muted-foreground`
  or `text-tertiary-foreground`. `text-foreground/90` in prose is intended.
- `entities/leave/ui/LeaveBalance.tsx:52`: no-op `dark:text-foreground`.

**Opacity on fills and borders**

- `bg-muted/50`, `/60`, `/30` (≈36): `components/ui/item.tsx:44`,
  `office-view.tsx:348`, `appearance-popover.tsx:287`,
  `workspace/ClientPortalCard.tsx:180`, `workspace/PhaseRail.tsx:374`,
  `whats-new/ui/WhatsNewPage.tsx:443,457`, `event-calendar/ui/day-view.tsx:103`,
  `mini-calendar.tsx:52,77`, `components/ReminderPicker.tsx:80` → `bg-muted`
  (or `hover:bg-accent`). Keep `dark:bg-muted/40` on pills.
- `border-border/50`, `/60`: `portal/PortalOverview.tsx:145,211`,
  `workspace/DashboardHome.tsx:73`, `ProjectDashboard.tsx:1435`,
  `ProjectSettings.tsx:384`, `components/ui/command.tsx:88`,
  `kpi/ProjectScoringView.tsx:352` → `border` (the token is already light).
- `border-foreground/10…/25` (≈20): `whats-new/ui/WhatsNewPage.tsx:382,413`,
  `WhatsNewDialog.tsx:260`, `policies/ui/PoliciesPage.tsx:523`,
  `processes/ui/ProcessesPage.tsx:202`, `clients/ui/ClientsPage.tsx:461`,
  `briefs/ui/BriefForm.tsx:612,1012-1013`, `brief-ui.tsx:86`,
  `components/file-drop-canvas.tsx:193`, `gallery-strip.tsx:239`,
  `ProjectKanban.tsx:205`, `workspace/TaskBoard.tsx:416` → `border-field-border`
  (dashed drop zones may keep a stronger border via a token).
- Status tints made by hand: `bg-primary/15` / `bg-destructive/15` /
  `bg-warning/15` in `event-color-registry.ts:63-177` → the `-subtle` tokens.

**Focus**

- Two halos in use: fields `ring-focus-ring` (22% primary) and
  buttons/badges/switch/radio `ring-primary/15`
  (`components/ui/button.tsx:6`, `badge.tsx:7`, `switch.tsx:18`,
  `radio-group.tsx:22`), plus `ring-primary/20…/40` in a few pages →
  one token, `ring-focus-ring`, everywhere.
- `components/ui/toggle.tsx:13` uses `border-input` (the only border use
  of `--input`) → `border-field-border`.

**Tokens**

- Unused tokens: `--dialog-shell`, `--dialog-panel`, `--row-surface` (as a
  class), `--*-line` (`success-line`, `warning-line`, `info-line`,
  `destructive-line`, `neutral-line`), `--chrome-muted` is only used via
  `.on-chrome`. Remove or adopt.
- `--chart-1…5` are identical in light and dark and are all amber/orange
  hues, but `components/charts/category-bar.tsx:30-34` maps `blue`,
  `emerald`, `violet` to them (a "blue" bar renders yellow) → map those
  names to `chartColors` instead.
- `getChartColors()` (`shared/lib/utils/cn.ts:78`) returns
  `var(--chart-6…8)`, which don't exist, and is unused → delete.
- Palette `.dark` (`src/app/palette.css:348`) applies only to `.dark`, not
  to the dark-chrome scope (`[data-chrome-dark]`), so `text-red-11` etc.
  stay light-mode values inside a dark sidebar in light mode. Add the
  dark-chrome selector there like globals.css does.
- Hex values inside `:root` tokens (`--border: #f3f3f3`, `--field-border:
var(--border)`, `--sidebar-border: #f0f0f0`, `--neutral-line`, `--*-line`,
  `--dialog-shell`) don't lean to the tint like the oklch ones do.
