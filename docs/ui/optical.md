# Optical balance

What the eye sees, not what the box says. Boxes can be mathematically
centred and equal, and still look off: icons carry empty space inside
their 24px box, round shapes look smaller than square ones, thin strokes
look lighter than text, capitals look bigger than lowercase. These rules
correct for it centrally (in shared components and tokens), never one
element at a time. Live, with before / after: **/ui** → Optical.

Every number below was measured in the browser on the real font (Geist,
canvas `measureText`) and the real icons (Untitled UI, `getBBox`), not
taken from a design spec. Re-measure after changing the font or icon set
(see "How to measure").

## Measured

**Geist (text)**

|                          | 12px | 13px | 14px                           | 24px        |
| ------------------------ | ---- | ---- | ------------------------------ | ----------- |
| Cap height (H)           | 8.52 | 9.23 | 9.94 (0.71em)                  | 17.0        |
| x-height (x)             | —    | 6.90 | 7.43 (0.53em)                  | —           |
| Round overshoot (O vs H) |      |      | +0.22 top, 0.22 below baseline |             |
| Stem, weight 450         | —    | 1.30 | 1.40                           | 2.35        |
| Stem, weight 500         | 1.34 | —    | 1.55                           | —           |
| Side bearing, H          |      |      | 1.25                           | 2.14        |
| Side bearing, T / A      |      |      | 0.17 / 0.28                    | 0.28 / 0.48 |

- Vertical: in a line box (`text-sm leading-5`), the **cap centre sits on
  the box centre** (0.03px off); the x-height centre sits **1.3px low**.
- Digits are proportional by default (`1` is 5.5px, `0` is 9.4px at 14px).

**Untitled UI icons (24px box, stroke included)**

| Glyph                                            | Live area                    | Of the box |
| ------------------------------------------------ | ---------------------------- | ---------- |
| Circle, CircleAlert, Info, Clock, Copy, Settings | 21.75                        | 90%        |
| Bell, Delete, CalendarDays, File                 | ~19.5 × 21.75                | 82–90%     |
| Search, Download, Upload, Square, ExternalLink   | 19.75                        | 82%        |
| Plus, ArrowLeft / Right                          | 15.75                        | 66%        |
| X (XClose), ChevronDown / Right                  | 13.75 (chevron 13.75 × 7.75) | 57%        |
| MoreHorizontal                                   | 17.75 × 3.75                 | —          |

At `size-4` (16px) that's: circle 14.5px, plus 10.5px (≈ the 14px cap
height, 9.9), X 9.2px. The set is already drawn optically (circles bigger
than squares, plus bigger than X), so don't resize single icons.

Icon stroke: **1.5 on the 24px grid, scaling with the icon** (`STROKE`):
1px at 16px, 0.875 at 14, 0.75 at 12, 2px at 32. The icon is one drawing at
every size (the set is being redrawn on this grid, /icon-lab). History:
1.75 scaling, then a fixed 1.4px and 1.25px on screen (non-scaling), which
read heavier than the label beside it at small sizes.

## The eight checks

**1. Button padding**

- An icon in a button carries ±2.75px of empty space (size-4, typical
  glyph), so the **icon side is 2px tighter than the text side**, at every
  size. Today the offsets differ (default −4px, sm −2px, lg −4px, xs −4px):
  default and lg look tight on the icon side, xs very tight.
- Applied in `src/components/ui/button.tsx`: icon side `xs` 10px,
  `sm` 8px, `default` 12px, `lg` 14px (text side 12 / 10 / 14 / 16), for
  `inline-start` and `inline-end`. Was −4 / −2 / −4 / −4.
- The gap the eye sees between icon and label is `gap` + the icon's empty
  space (sm: 4 + 2.75 ≈ 6.75px). Keep `gap-1` / `gap-1.5`; don't add more.
- Icon-only buttons: the icon box is centred (size-7 → 6px each side). Do
  not nudge; the glyphs are centred in their boxes (chevrons included).

**2. Icon balance**

- Same box for every icon in a context (`size-4` beside 14px text). The
  set's own sizing (90% / 82% / 66% / 57%) is the balance; never give one
  icon a custom size or margin to "match" its neighbours.
- Pointing glyphs (play, triangles) have their mass off-centre; only for
  a play button inside a round control, nudge 1px toward the point.

**3. Icon area**

- Beside text: icon box = 16px for 13–15px text, 14px (`size-3.5`) for
  13px meta, 12px (`size-3`) for 12px. The plus-type live area then equals
  the cap height.
- In a row, icon and text centre on the cap centre: `items-center` is
  right for Geist (cap centre = line centre).

**4. Color weight**

- An icon and text in the same color should look equally heavy. Today
  icons are lighter (1.17px vs the text stem 1.40 at 450, 1.55 at 500),
  most visibly at `size-3.5` / `size-3` and in muted color.
- Applied (`src/components/icons/index.tsx`, `custom.tsx`): **1.5 on the
  24px grid, scaling** with the icon (1px at `size-4`). An icon holds
  more ink than a letter (closed shapes, corners), so a stroke thinner
  than the text stem (1.4 at 14px) still weighs like the label beside it.
  Don't go per-weight or per-place.
- Until then: don't put muted icons beside foreground text to "soften"
  them; thin strokes already read lighter. Status icons use the `-ink`
  tokens (darker) rather than the base status color.

**5. Glyph overshoot**

- Round letters overshoot by 0.22px (the font handles it). The same
  applies to shapes: a circle must be slightly bigger than a square to
  look the same size. Person avatars (round) and `ProjectAvatar` (rounded
  square) share a size class; the square's 5px radius already offsets it.
  Don't enlarge or shrink one of them.
- Dots (unread, status) are round: `size-2` reads like a 7px square.

**6. Case scale**

- No UPPERCASE in UI text (labels, badges, buttons, headers): capitals
  read bigger and tighter, and Indonesian copy runs long.
- Where caps are unavoidable (keyboard keys, codes): one step smaller and
  `tracking-[0.06em]` (e.g. 12px caps → 11px).
- Numbers: `tabular-nums` wherever digits line up or change (tables,
  timers, counts, money), since Geist's digits are proportional.

**7. Button label**

- `font-medium` (500), sentence case ("Simpan draft"), no trailing
  period, `tracking-normal`. Counts in a label: `tabular-nums`.
- Sentence case also fixes vertical centring: an all-lowercase label sits
  1.3px low (x-height centre), a capitalised one sits on centre.

**8. Letter alignment**

- Side bearings grow with size: a 24px straight-stem letter (H, K, B…)
  starts 0.9px further in than 14px text below it, so big titles look
  indented against the body.
- Applied on `PageHeader`'s title (`src/components/page-header.tsx`):
  `ms-[-0.04em]` (−0.96px at 24px). Use the same on other left-aligned
  titles ≥ 24px. Not for text under 20px (the
  difference is under 0.5px), not on round or diagonal first letters
  where it would overshoot (O, A, V start almost at 0).

**Vertical centring (badges, pills, tags)**

- Geist's cap centre is the line-box centre, so symmetric padding is
  right. Don't add `pt-px` / asymmetric padding to "fix" a label: fix the
  case (sentence case) instead.

## Use

| Need                 | Use                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| An icon beside text  | the component's own slot (`data-icon`, `ListChip`, `Badge`) or `size-4` / `size-3.5` per the table above |
| Icon in a button     | `data-icon="inline-start" / "inline-end"`: the button does the padding                                   |
| Numbers              | `tabular-nums`                                                                                           |
| Caps you can't avoid | one step smaller + `tracking-[0.06em]`                                                                   |

## Don't

- Nudge or resize a single icon with margins, `translate`, or a custom
  size to make it "look right" (fix the shared rule instead).
- Same padding on the icon side and the text side of a button.
- Per-place `strokeWidth`.
- UPPERCASE labels, statuses, buttons; all-lowercase labels.
- Asymmetric padding to centre text by hand.

## How to measure

On a page with the icons (e.g. /ui → Icons), in the browser console:
`svg.getBBox()` for a glyph's live area (add the stroke width), and a
canvas `measureText("H")` (`actualBoundingBoxAscent`, `…Left`) with the
page's `font-family` for cap height, x-height and side bearings. For
stems, draw "l" on a canvas at 8x and count the covered pixels across.

## Migration notes

Applied 2026-11-05 (local, not pushed): button icon-side padding, the
fixed icon stroke (1.4px, then 1.25px), PageHeader title alignment. Still to do:

- **Caps**: audit `uppercase` (`grep -rn "uppercase" src`, 5 places) →
  sentence case, or the caps rule above.
- **Lowercase labels**: badge / button copy that is all lowercase in
  i18n strings → sentence case.
- **Other big titles**: left-aligned `text-2xl`+ titles outside
  `PageHeader` → `ms-[-0.04em]`.
