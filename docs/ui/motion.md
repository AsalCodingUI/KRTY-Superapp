# Motion

Easing, durations, and when to animate: enter / exit, collapse, sliding
highlights, numbers that roll, list rows, page and tab changes. Live
examples: **/ui** → Motion.

## Use

| Need                                  | Use                                                    | File                                             |
| ------------------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Show / hide content under a toggle    | `Collapse open`                                        | `src/components/ui/collapse.tsx`                 |
| Active item of tabs / segments / nav  | `SlidingIndicator activeSelector`                      | `src/components/sliding-indicator.tsx`           |
| Row hover in a list or table          | `HoverHighlight` (built into `GroupedList`, DataTable) | same                                             |
| Selected rows in a `<table>`          | `RowHighlights`                                        | same                                             |
| Rows added / removed                  | `ListRow` inside `AnimatePresence initial={false}`     | `src/components/grouped-list.tsx`                |
| A figure that changes (quarter, data) | `RollingValue value`                                   | `src/components/rolling-value.tsx`               |
| A tab panel settling in on switch     | `useTabSwitched(tab) && TAB_ENTER`                     | `src/shared/hooks/useTabSwitched.ts`             |
| Workspace / project page change       | `WorkspaceTransition` (already in the shell)           | `src/components/page-transition.tsx`             |
| Progress / meter fill                 | `bar-grow` / `bar-grow-y` + `--bar: 40%`               | `src/app/globals.css`                            |
| Rare entrance (empty state, card)     | `enter-rise`                                           | `src/app/globals.css`                            |
| Count going up                        | `animate-count-pop` (re-key on change)                 | `src/app/globals.css`, `components/nav-main.tsx` |
| Checkbox tick                         | `animate-check-draw` (in `Checkbox`)                   | `src/components/ui/checkbox.tsx`                 |
| Light ↔ dark                          | `useThemeTransition().setTheme`                        | `src/shared/hooks/useThemeTransition.ts`         |
| Hover animation on an icon            | `@/components/icons` (plays on its interactive parent) | `src/components/icons/animated.tsx`              |
| Brand backdrop (minimal screens)      | `BrandBackdrop` (`GradientASCII still`)                | `src/components/brand-backdrop.tsx`              |
| Dialog, sheet, popover, menu, tooltip | The primitive's own motion; don't add any              | `src/components/ui/*`                            |

Motion (`motion/react`) is set up once in `MotionProvider`
(`src/components/providers/motion-provider.tsx`): `LazyMotion` with the
slim `domAnimation` features loaded async, and
`MotionConfig reducedMotion="user"`. Components use `m.*`, never `motion.*`.

## Tokens

| Token                   | Value                                               | For                                                          |
| ----------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| `ease-out` (Tailwind)   | `--ease-out` = `cubic-bezier(0.23, 1, 0.32, 1)`     | Everything: enter, exit, highlights, collapse. The one ease. |
| `ease-in-out`           | `--ease-in-out` = `cubic-bezier(0.77, 0, 0.175, 1)` | Something already on screen moving to a new spot (rare)      |
| `ease-drawer`           | `--ease-drawer` = `cubic-bezier(0.32, 0.72, 0, 1)`  | Sheets and drawers only (in `sheet.tsx`, `drawer.tsx`)       |
| JS ease                 | `[0.23, 1, 0.32, 1]`                                | The same curve for `m.*` transitions                         |
| `duration-150` / `0.15` | 150ms                                               | Hover, color, small popovers, press, icon swaps              |
| `duration-200` / `0.2`  | 200ms                                               | **Default**: rows, collapse, highlights, swaps               |
| `duration-300` / `0.3`  | 300ms                                               | Larger arrivals: page change, `enter-rise`, theme fade       |
| `bar-grow`              | 600ms                                               | Data fills only (bars, meters), once on mount                |

`--ease-out` overrides Tailwind's own key in `globals.css`, so plain
`ease-out` is already the strong curve: never write
`ease-[cubic-bezier(0.23,1,0.32,1)]`.

## Rules

**Ease and timing**

- One ease: `ease-out` in classes, `[0.23, 1, 0.32, 1]` in `m.*`
  transitions. Three durations: 150 / 200 / 300ms. Data fills 600ms.
- A bare `transition-*` uses Tailwind's weak default curve: always add
  `ease-out` (and a duration when it isn't 150ms).
- Exit is as fast as or faster than enter (DataTable: in 200ms, out 160ms).
- No springs, except the two shared-layout glides that already exist
  (`floating-tab-bar.tsx` `TAB_SPRING`, `BriefForm.tsx` `GLIDE`) and the
  sign-in arrival.

**What moves**

- Animate `transform` and `opacity` only. Height via `Collapse` (grid
  rows), never by measuring. Width / height of a fill via `bar-grow`.
- Small distances: 4px for rows and swaps (`y: -4` / `y: 4`), 8px for
  `enter-rise`, 28px for the page slide. Scale no lower than 0.96.
- Blur only on rare, full-screen moments (page change, sign-in), and end
  with `transitionEnd: { filter: "none" }` (a leftover filter traps fixed
  and sticky children).
- One indicator that slides between items (`SlidingIndicator`,
  `HoverHighlight`), never each item animating its own background.
- Nothing animates on first render: `AnimatePresence initial={false}`,
  `useTabSwitched`, `SlidingIndicator` and `HoverHighlight` snap first.

**Light**

- No per-row motion above 50 rows: `GroupedList` and DataTable switch it
  off (`ANIMATED_ROW_LIMIT = 50`). Don't wrap rows in your own `m.*`.
- Paging, sorting and filtering re-key the `AnimatePresence`
  (`key={page}`, `key={rowsKey}`) so the swap doesn't animate every row.
- No `layout` animations in lists. `layout` / `layoutId` need the full
  feature set: wrap that one component in
  `<LazyMotion features={…motion-features-max}>` (see
  `floating-tab-bar.tsx`); without it `layout` does nothing.
- Infinite animations only while something is actually loading
  (`Spinner`, `Skeleton`). Canvas / frame loops stop when offscreen or
  the tab is hidden (`GradientASCII`: IntersectionObserver +
  `visibilitychange`) and hold `still` after their intro.
- Motion features load lazily; import `m` from `motion/react`, not
  `motion` (that pulls the full bundle).

**Reduced motion**

- `MotionConfig reducedMotion="user"` turns `m.*` transforms off app-wide.
  Where an `m.*` must also skip opacity / change shape, use
  `useReducedMotion()` (`zoomable.tsx`: fade only).
- CSS: add `motion-reduce:transition-none` or `motion-reduce:animate-none`
  to every movement you add; `globals.css` already zeroes tw-animate's
  translate / scale under reduced motion (fades stay).
- Keep fades, drop movement: fewer and gentler, not zero.

## Don't

- `const EASE = [0.23, 1, 0.32, 1]` copied into a page, or
  `ease-[cubic-bezier(0.23,1,0.32,1)]` in a class (use `ease-out`).
- Other curves: `cubic-bezier(0.22,1,0.36,1)`, `(0.2,0,0,1)`,
  `(0.16,1,0.3,1)`, `"easeOut"`, `"easeInOut"`.
- Off-scale durations: 100, 125, 180, 220, 250, 350, 400, 450, 500, 700ms.
- `m.div animate={{ width }}` per row, or `transition-[width]` on a bar
  (use `bar-grow`).
- `transition-all`.
- `layout` on list rows, or `layout` without the max features loaded.
- Your own per-item hover / active background animations.
- `animate-ping` / `animate-bounce` / `animate-pulse` left running on
  something that isn't loading.
- `motion.div` (use `m.div`).

## Not motion (keep their own)

- Vendored primitives: `drawer.tsx` (Base UI drawer, swipe physics,
  450ms), `navigation-menu.tsx`, `dialog.tsx` mobile drag, `sheet.tsx`.
- Animated icons in `src/components/icons/*` (from lucide-animated; their
  own curves and springs).
- `GradientASCII` (WebGL, its own intro clock).
- Drag-and-drop drop animation (`dnd-kit` `DROP_ANIMATION`, ms + CSS
  string), as long as it uses the canonical curve.

## Good examples

- Collapse (no measuring, reversible): `src/components/ui/collapse.tsx`
- Sliding indicator: `src/components/segmented-control.tsx`,
  `src/components/nav-main.tsx`
- Rows add / remove with a 50-row limit: `src/components/grouped-list.tsx`,
  `src/components/data-table/data-table.tsx`
- Number roll: `src/components/rolling-value.tsx`
- Tab enter only after a switch: `src/page-slices/performance/ui/PerformancePage.tsx`
- Reduced motion in an `m.*`: `src/components/zoomable.tsx`
- Frame loop that stops: `src/components/brand-backdrop.tsx`

## Example

```tsx
// Class: the shared curve and a scale duration.
<span className="transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none" />

// Show / hide: Collapse, not an m.div with height.
<Collapse open={open}>{children}</Collapse>

// Rows that come and go (≤ 50 rows animate, more don't).
<GroupedList>
  <AnimatePresence initial={false} key={page}>
    {rows.map((r) => (
      <ListRow key={r.id}>{r.name}</ListRow>
    ))}
  </AnimatePresence>
</GroupedList>

// A one-off m.* transition (until src/shared/lib/motion.ts exists, see
// Migration notes): the one ease, a scale duration.
<m.div
  initial={{ opacity: 0, y: 4 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
/>
```

## Migration notes

Nothing below is changed yet. Proposed shared constant (not created):
`src/shared/lib/motion.ts`

```ts
export const EASE_OUT = [0.23, 1, 0.32, 1] as const
export const DURATION = { fast: 0.15, base: 0.2, slow: 0.3 } as const
export const TRANSITION = { duration: DURATION.base, ease: EASE_OUT } as const
```

**Duplicated JS ease → `EASE_OUT` / `TRANSITION`**

- `const EASE = [0.23, 1, 0.32, 1]`: `src/app/(fullscreen)/login/page.tsx:20`,
  `src/app/(fullscreen)/p/[token]/PinForm.tsx:26`,
  `src/page-slices/contracts/ui/ContractDialog.tsx:39`,
  `src/page-slices/projects/ui/workspace/TaskDialog.tsx:100`,
  `src/page-slices/projects/ui/workspace/PhaseRail.tsx:45`,
  `src/page-slices/projects/ui/workspace/TaskBoard.tsx:73`,
  `src/components/page-transition.tsx:14`, `src/components/icons/extra.tsx:62`.
- `const ROW_EASE`: `src/components/grouped-list.tsx:158`.
- Inline `ease: [0.23, 1, 0.32, 1]`:
  `src/features/attendance-clock/ui/ClockControls.tsx:172`,
  `src/page-slices/projects/ui/portal/PortalShell.tsx:268`,
  `src/page-slices/leave/ui/components/ApprovalInbox.tsx:75,520,578`,
  `src/components/zoomable.tsx:90`, `src/components/rolling-value.tsx:35`,
  `src/components/app-sidebar.tsx:270`,
  `src/components/data-table/data-table.tsx:45`.
- `login/page.tsx:22-56` and `PinForm.tsx:28-60` define the same
  `STAGGER` / `ICON` / `RISE` variants: share them (e.g. `ARRIVAL` in
  `motion.ts` or `components/minimal-screen.tsx`).

**Literal curve in classes → `ease-out`**

- `ease-[cubic-bezier(0.23,1,0.32,1)]`:
  `src/app/(main)/dashboard/components/attendance-split.tsx:66`,
  `src/page-slices/projects/ui/workspace/TaskDialog.tsx:341`,
  `src/page-slices/projects/ui/workspace/TaskBoard.tsx:562`,
  `src/page-slices/projects/ui/my-notes/MyNotesPage.tsx:597`,
  `src/page-slices/performance/ui/review/ReviewResult.tsx:171`,
  `src/page-slices/performance/ui/kpi/MyKpiView.tsx:207`,
  `src/components/sliding-indicator.tsx:178,280`.
- CSS literal: `globals.css:1048` (view transition) → `var(--ease-out)`;
  `src/page-slices/projects/ui/workspace/TaskBoard.tsx:77` (dnd string) →
  keep the string but import it from `motion.ts`.
- `src/components/ui/dialog.tsx:128` writes
  `cubic-bezier(0.32, 0.72, 0, 1)` in JS → `var(--ease-drawer)`.

**Off-canon curves**

- `cubic-bezier(0.2, 0, 0, 1)`: `src/page-slices/projects/ui/ProjectKanban.tsx:263`
  → the canonical curve (same as TaskBoard).
- `cubic-bezier(0.22, 1, 0.36, 1)` + `0.35s`:
  `src/components/ui/navigation-menu.tsx:89,113,118` → `ease-out duration-300`
  (or leave as vendored).
- `cubic-bezier(0.165, 0.84, 0.44, 1)`: `globals.css:197` (`focus-in`).
- `"easeOut"`: `src/page-slices/performance/ui/kpi/ProjectScoringView.tsx:1043`,
  `src/app/(fullscreen)/p/[token]/PinForm.tsx:118` → `EASE_OUT`.
- `ease-linear`: `src/components/ui/sidebar.tsx:283,295` (sidebar width) → `ease-out`.
- `tailwind.config.ts:85-100`: legacy `animation` / `keyframes`
  (`slideDownAndFade`, `dialogContentShow`, … with `(0.16, 1, 0.3, 1)`)
  are unused → delete. `transitionDuration` `fast/base/slow/slower`
  (`:78-83`) are unused → delete, or adopt them as the three tokens.

**Off-scale durations**

- 250ms: `src/components/ui/dialog.tsx:40`, `src/components/ui/alert-dialog.tsx:38`
  (overlay), `TaskBoard.tsx:521`, `PortalShell.tsx:268` → 200 or 300.
- 125ms: `src/components/ui/tooltip.tsx:53` → 150. 100ms:
  `src/components/ui/item.tsx:38` → 150.
- 180ms: `zoomable.tsx:90`, `page-transition.tsx:57` (pending) → 150 / 200.
  220ms: `rolling-value.tsx:35`, `TaskBoard.tsx:76`, `ProjectKanban.tsx:262` → 200.
  320ms: `page-transition.tsx:57` → 300. 160ms exit: `data-table.tsx:44` → 150.
- 400ms: `ProjectScoringView.tsx:1043`; 500ms: `ProjectScoringView.tsx:515`,
  `MyKpiView.tsx:84`; 700ms: `attendance-split.tsx:66`, `ReviewResult.tsx:171`,
  `MyKpiView.tsx:207` → `bar-grow` (600ms) or 300.
- Keyframes in `globals.css`: `tab-enter` 180ms (`:25`) → 200;
  `footer-in` 240ms (`:35`) and `count-pop` 260ms (`:44`) → 200 / 300.

**Width animated instead of `bar-grow`**

- `ProjectScoringView.tsx:1039-1043` (`m.div animate={{ width }}` per row),
  `ProjectScoringView.tsx:515`, `ReviewResult.tsx:171`,
  `MyNotesPage.tsx:597`, `TaskDialog.tsx:341` (`transition-[width]`)
  → `bar-grow` with `--bar`.

**`layout` that does nothing** (the app loads `domAnimation`, which has no
layout): `ApprovalInbox.tsx:516` (`layout` on every inbox row),
`TaskDialog.tsx:928` and `TaskBoard.tsx:517` (`layout="position"`). Either
drop `layout`, or wrap those components in the max features. For the inbox,
drop it (a list).

**Reduced motion gaps**

- `enter-rise` (`globals.css:226-233`) has no reduced-motion rule: the 8px
  rise still runs → add `@media (prefers-reduced-motion: reduce)` keeping
  only the fade.
- `animate-bounce`: `TaskDialog.tsx:850` → add `motion-reduce:animate-none`.
- `animate-ping` forever on the unread bell:
  `src/widgets/notifications/ui/Notifications.tsx:93` → a still dot (see
  feedback.md).
- `src/features/leave-request/ui/LeaveRequestForm.tsx:156-157`:
  `animate-pulse` text + `RiLoader2Line animate-spin` (an animated icon
  spun by CSS) → `Spinner`.
- `src/page-slices/policies/ui/doc-editor-lazy.tsx:16` hand-made pulse
  → `Skeleton`.

**Other**

- `animate-fadeIn` doesn't exist (no such keyframe):
  `src/widgets/event-calendar/ui/event-dialog.tsx:867`,
  `dialog-variants/BaseReadOnlyDialog.tsx:214`, `dialog-variants/MeetingDialog.tsx:191`
  → remove, or `enter-rise`.
- Literal `"animate-tab-enter motion-reduce:animate-none"`:
  `src/page-slices/projects/ui/workspace/ProjectWorkspacePage.tsx:73`,
  `ProjectLibrary.tsx:1038` → `TAB_ENTER`.
- Unused utilities `focus-in`, `shimmer-in` (`globals.css:166-205`) → delete,
  or use them on the sign-in screen instead of the duplicated JS variants.
- `globals.css:207`: the `enter-rise` comment sits above `avatar-stack`
  → move it to `:226`.
- `ListGroup` chevron (`grouped-list.tsx:137`) `transition-transform` with
  no ease → add `duration-200 ease-out motion-reduce:transition-none`.
- `globals.css:936` (`doc-drop-bar`, 80ms `ease-out` keyword) and `:983`,
  `:995` (task list checkbox 150ms, one without ease) → `var(--ease-out)`.
- Springs outside the allowed list: `PinForm.tsx:216` (digit pop) → fine
  as part of the sign-in arrival, keep it with the shared variants.
