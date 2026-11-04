---
name: optical-balance
description: Check and fix optical balance in Kretya UI — button padding with icons, icon balance and area, icon stroke vs text weight (color weight), glyph overshoot, case scale, button labels, letter alignment and vertical centring of text in pills. Use when building or reviewing any button, badge, chip, icon + text pair, avatar, title or pill in this repo, when something "looks off-centre / too heavy / too light / misaligned" even though the numbers are equal, or when the user mentions optical balance, optical alignment or optical sizing.
---

# Optical balance (Kretya)

The rules, with measured numbers for Geist and the Untitled UI icons, are
in `docs/ui/optical.md`; the live before / after is /ui → Optical. Read
the doc first. This skill is the working checklist.

## Principle

Fix optical issues **centrally** (the shared component, token or icon
module) and never per element. If one place looks wrong, the rule is
wrong or not applied: change the rule, update `docs/ui/optical.md` and
the Optical tab, and say so.

## Checklist (run on every piece of UI you touch)

1. **Button padding**: icon side 2px tighter than the text side
   (`data-icon` + the button's own padding). No manual `pl-*` on buttons.
2. **Icon balance**: one box size per context; never resize, nudge or
   margin a single icon. The set is drawn optically.
3. **Icon area**: `size-4` beside 13–15px text, `size-3.5` beside 13px
   meta, `size-3` in 12px badges. `items-center` (Geist's cap centre is
   the line centre).
4. **Color weight**: icon stroke vs text stem. Don't mute an icon next to
   foreground text; status icons use `-ink` tokens.
5. **Glyph overshoot**: round vs square shapes at one size class
   (avatars, dots); don't compensate by hand.
6. **Case scale**: no UPPERCASE; unavoidable caps one step smaller +
   `tracking-[0.06em]`; digits `tabular-nums`.
7. **Button label**: `font-medium`, sentence case, no trailing period.
8. **Letter alignment**: titles ≥ 24px may need `ms-[-0.04em]` against
   body text below (straight-stem first letters only).
9. **Vertical centring**: symmetric padding in pills; fix all-lowercase
   copy (sits 1.3px low) instead of padding by hand.

## Measuring (when unsure, or after a font / icon change)

Open a page with the element (or /ui → Optical / Icons) in the browser
and measure; don't guess:

```js
// glyph live area in its 24px box (add the stroke width)
svg.getBBox()
// font metrics with the page's font
const c = document.createElement("canvas").getContext("2d")
c.font = `450 14px ${getComputedStyle(document.body).fontFamily}`
c.measureText("H") // actualBoundingBoxAscent = cap height, …Left = side bearing
// on-screen icon stroke = STROKE × size / 24 (components/icons/custom.tsx)
```

Report findings as numbers (px), compare against the doc's table, and
put new measurements into `docs/ui/optical.md`.
