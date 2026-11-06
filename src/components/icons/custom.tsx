/**
 * The app's icon stroke, and the glyph Untitled UI's
 * free set doesn't have, drawn the same way (24px, round caps and joins,
 * no fill) so it sits with the rest.
 */
import type { SVGProps } from "react"

/** The icons' stroke on their 24px grid: 1.5. It scales with the icon
 *  (1px at size-4, 2px at 32px), so every size is the same drawing, just
 *  bigger or smaller (docs/ui/icons.md). */
export const STROKE = 1.5

/** Glyphs drawn here carry `ours: true`, and so do the app icons made
 *  from them (index.tsx): /icon-lab marks those as redrawn. */
type GlyphProps = SVGProps<SVGSVGElement> & { size?: number; color?: string }

export function glyph(name: string, d: string) {
  const Glyph = ({
    size = 24,
    color = "currentColor",
    ...props
  }: GlyphProps) => (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={d} />
    </svg>
  )
  Glyph.displayName = name
  ;(Glyph as { ours?: boolean }).ours = true
  return Glyph
}

/** A cup with steam (breaks). */
export const Coffee = glyph(
  "Coffee",
  "M7 3v2M11 3v2M15 3v2M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9ZM17 10h1.5a2.5 2.5 0 0 1 0 5H17M3 22h16",
)

/** A drag handle of six filled dots (2 × 3 standing, 3 × 2 lying): the
 *  set's own grip is a 3 × 3 grid, heavier than a handle needs. Filled,
 *  so the stroke setting doesn't change them. */
export function dots(name: string, xs: number[], ys: number[], r = 1.75) {
  const Dots = ({
    size = 24,
    color = "currentColor",
    strokeWidth: _s,
    ...props
  }: GlyphProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
      {ys.flatMap((cy) =>
        xs.map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />),
      )}
    </svg>
  )
  Dots.displayName = name
  ;(Dots as { ours?: boolean }).ours = true
  return Dots
}

export const GripVertical = dots("GripVertical", [9, 15], [5, 12, 19])
export const GripHorizontal = dots("GripHorizontal", [5, 12, 19], [9, 15])

/* ---------------------------------------------------------------------------
 * Kretya set, first 20 (redrawn from the Untitled UI base). 24px grid,
 * 1.5 stroke (scales), round caps and joins; live area 3–21 (2px padding,
 * circles a touch bigger: r 8.5–9.25); squares and cards rx 2.5–3, a bit
 * softer than Untitled's. One idea per icon, no inner detail under 2px.
 * ------------------------------------------------------------------------- */

export const Home = glyph(
  "Home",
  "M3.75 10.25 12 3.75l8.25 6.5V18a2.5 2.5 0 0 1-2.5 2.5H15v-5a1.5 1.5 0 0 0-1.5-1.5h-3A1.5 1.5 0 0 0 9 15.5v5H6.25a2.5 2.5 0 0 1-2.5-2.5Z",
)
export const CalendarDays = glyph(
  "CalendarDays",
  "M3.75 8a3 3 0 0 1 3-3h10.5a3 3 0 0 1 3 3v9.5a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3ZM3.75 10h16.5M8 3v4M16 3v4",
)
export const Folder = glyph(
  "Folder",
  "M3.5 7.25a2.75 2.75 0 0 1 2.75-2.75h2.9a2 2 0 0 1 1.6.8l1.1 1.4a2 2 0 0 0 1.6.8h4.3a2.75 2.75 0 0 1 2.75 2.75v7.5a2.75 2.75 0 0 1-2.75 2.75H6.25a2.75 2.75 0 0 1-2.75-2.75Z",
)
export const Search = glyph(
  "Search",
  "M17.25 10.75a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM15.5 15.5l4.75 4.75",
)
export const Bell = glyph(
  "Bell",
  "M18 10.5a6 6 0 0 0-12 0v4.4l-1.45 1.75a.9.9 0 0 0 .7 1.47h13.5a.9.9 0 0 0 .7-1.47L18 14.9ZM9.75 20.75a2.6 2.6 0 0 0 4.5 0",
)
export const Settings = glyph(
  "Settings",
  "M9.96 4.89 10.24 2.92h3.52l.28 1.97 1.55.64 1.58-1.2 2.5 2.5-1.2 1.58.64 1.55 1.97.28v3.52l-1.97.28-.64 1.55 1.2 1.58-2.5 2.5-1.58-1.2-1.55.64-.28 1.97h-3.52l-.28-1.97-1.55-.64-1.58 1.2-2.5-2.5 1.2-1.58-.64-1.55-1.97-.28v-3.52l1.97-.28.64-1.55-1.2-1.58 2.5-2.5 1.58 1.2ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
)
export const Users = glyph(
  "Users",
  "M12.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM3 20a6 6 0 0 1 12 0M15.5 4.2a3.5 3.5 0 0 1 0 6.6M17.5 14.3A6 6 0 0 1 21 20",
)
export const Check = glyph("Check", "M5 12.75 9.5 17.25 19 7.25")
export const X = glyph("X", "M6.75 6.75l10.5 10.5M17.25 6.75l-10.5 10.5")
export const Plus = glyph("Plus", "M12 5v14M5 12h14")
export const ChevronDown = glyph("ChevronDown", "M7 10l5 5 5-5")
export const ChevronRight = glyph("ChevronRight", "M10 7l5 5-5 5")
export const ArrowLeft = glyph(
  "ArrowLeft",
  "M19 12H5.5M11 6.25 5.25 12 11 17.75",
)
export const Trash2 = glyph(
  "Trash2",
  "M4 6.75h16M9.5 6.75v-1.5A1.75 1.75 0 0 1 11.25 3.5h1.5a1.75 1.75 0 0 1 1.75 1.75v1.5M6 6.75l.8 11.4a2.5 2.5 0 0 0 2.5 2.35h5.4a2.5 2.5 0 0 0 2.5-2.35L18 6.75M10 10.75v5.5M14 10.75v5.5",
)
export const Pencil = glyph(
  "Pencil",
  "M4 20l.9-4.1a2 2 0 0 1 .54-.98L15.3 5.05a2.1 2.1 0 0 1 2.97 0l.68.68a2.1 2.1 0 0 1 0 2.97l-9.87 9.86a2 2 0 0 1-.98.54ZM13.75 6.6l3.65 3.65",
)
export const Link = glyph(
  "Link",
  "M10.25 13.75a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.1 1.1M13.75 10.25a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.1-1.1",
)
export const Copy = glyph(
  "Copy",
  "M8.5 11a2.5 2.5 0 0 1 2.5-2.5h7a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 8.5 18ZM15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5",
)
export const MoreHorizontal = dots("MoreHorizontal", [5.5, 12, 18.5], [12])
export const FileText = glyph(
  "FileText",
  "M13.5 3.5H7.25A2.75 2.75 0 0 0 4.5 6.25v11.5a2.75 2.75 0 0 0 2.75 2.75h9.5a2.75 2.75 0 0 0 2.75-2.75V9.5ZM13.5 3.5v4a2 2 0 0 0 2 2h4M8.5 13.25h7M8.5 16.5h4.5",
)
export const Clock = glyph(
  "Clock",
  "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0ZM12 7.5V12l3 2",
)
