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
  "M4 9.5h12v5.5a4.5 4.5 0 0 1-4.5 4.5h-3A4.5 4.5 0 0 1 4 15ZM16 11h1.25a2.75 2.75 0 0 1 0 5.5H16M8 4v2.5M12 4v2.5",
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

export const GripVertical = dots("GripVertical", [9, 15], [6, 12, 18])
export const GripHorizontal = dots("GripHorizontal", [6, 12, 18], [9, 15])

/* ---------------------------------------------------------------------------
 * Kretya set, first 20 (redrawn from the Untitled UI base). 24px grid,
 * 1.5 stroke (scales), round caps and joins; live area 3–21 (2px padding,
 * circles a touch bigger: r 8.5–9.25); squares and cards rx 2.5–3, a bit
 * softer than Untitled's. One idea per icon, no inner detail under 2px.
 * ------------------------------------------------------------------------- */

export const Home = glyph(
  "Home",
  "M4 19L4 10.45A1.5 1.5 0 0 1 4.54 9.3L11.04 3.9A1.5 1.5 0 0 1 12.96 3.9L19.46 9.3A1.5 1.5 0 0 1 20 10.45L20 19A1.5 1.5 0 0 1 18.5 20.5L5.5 20.5A1.5 1.5 0 0 1 4 19ZM9.75 20.5v-4a2.25 2.25 0 0 1 4.5 0v4",
)
export const CalendarDays = glyph(
  "CalendarDays",
  "M3.75 8a3 3 0 0 1 3-3h10.5a3 3 0 0 1 3 3v9.5a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3ZM3.75 10h16.5M8 3v4M16 3v4",
)
export const Folder = glyph(
  "Folder",
  "M3.5 7a3 3 0 0 1 3-3h2.65a2 2 0 0 1 1.6.8l1.1 1.4a2 2 0 0 0 1.6.8h4.05a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3Z",
)
export const Search = glyph(
  "Search",
  "M17.25 10.75a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0ZM15.5 15.5l4.75 4.75",
)
export const Bell = glyph(
  "Bell",
  "M6.25 9.25a5.75 5.75 0 0 1 11.5 0L17.75 13.3A1.5 1.5 0 0 0 18 14.13L18.2 14.42A1.5 1.5 0 0 1 16.95 16.75L7.05 16.75A1.5 1.5 0 0 1 5.8 14.42L6 14.13A1.5 1.5 0 0 0 6.25 13.3L6.25 9.25ZM10 19.75a3 3 0 0 0 4 0",
)
export const Settings = glyph(
  "Settings",
  "M10.02 5.22L10.15 4.29A1.5 1.5 0 0 1 11.64 3L12.36 3A1.5 1.5 0 0 1 13.85 4.29L13.98 5.22A1.5 1.5 0 0 0 14.72 6.31L15.57 6.8A1.5 1.5 0 0 0 16.88 6.9L17.75 6.54A1.5 1.5 0 0 1 19.61 7.19L19.97 7.82A1.5 1.5 0 0 1 19.6 9.75L18.86 10.33A1.5 1.5 0 0 0 18.28 11.51L18.28 12.49A1.5 1.5 0 0 0 18.86 13.67L19.6 14.25A1.5 1.5 0 0 1 19.97 16.18L19.61 16.81A1.5 1.5 0 0 1 17.75 17.46L16.88 17.1A1.5 1.5 0 0 0 15.57 17.2L14.72 17.69A1.5 1.5 0 0 0 13.98 18.78L13.85 19.71A1.5 1.5 0 0 1 12.36 21L11.64 21A1.5 1.5 0 0 1 10.15 19.71L10.02 18.78A1.5 1.5 0 0 0 9.28 17.69L8.43 17.2A1.5 1.5 0 0 0 7.12 17.1L6.25 17.46A1.5 1.5 0 0 1 4.39 16.81L4.03 16.18A1.5 1.5 0 0 1 4.4 14.25L5.14 13.67A1.5 1.5 0 0 0 5.72 12.49L5.72 11.51A1.5 1.5 0 0 0 5.14 10.33L4.4 9.75A1.5 1.5 0 0 1 4.03 7.82L4.39 7.19A1.5 1.5 0 0 1 6.25 6.54L7.12 6.9A1.5 1.5 0 0 0 8.43 6.8L9.28 6.31A1.5 1.5 0 0 0 10.02 5.22ZM14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
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
  "M4 6.75h16M9.5 3.75h5M6 6.75l.8 11.4a2.5 2.5 0 0 0 2.5 2.35h5.4a2.5 2.5 0 0 0 2.5-2.35L18 6.75M10 10.75v5.5M14 10.75v5.5",
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
  "M11.5 8.5H17.5A3 3 0 0 1 20.5 11.5V17.5A3 3 0 0 1 17.5 20.5H11.5A3 3 0 0 1 8.5 17.5V11.5A3 3 0 0 1 11.5 8.5ZM15.5 8.5v-2a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h2",
)
export const MoreHorizontal = dots("MoreHorizontal", [5.5, 12, 18.5], [12])
export const FileText = glyph(
  "FileText",
  "M13.5 3.5H7.5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V9.5ZM13.5 3.5v4a2 2 0 0 0 2 2h4M8.5 13.25h7M8.5 16.5h4.5",
)
export const Clock = glyph(
  "Clock",
  "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0ZM12 7.5V12l3 2",
)

/* Where the Untitled glyph didn't match the app's meaning. */
export const CircleDot = glyph(
  "CircleDot",
  "M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0ZM14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z",
)
/** Eight arcs of the r 8.5 circle, round-capped, so it reads dashed. */
export const CircleDashed = glyph(
  "CircleDashed",
  "M10.34 3.66a8.5 8.5 0 0 1 3.32 0M16.72 4.93a8.5 8.5 0 0 1 2.35 2.35M20.34 10.34a8.5 8.5 0 0 1 0 3.32M19.07 16.72a8.5 8.5 0 0 1-2.35 2.35M13.66 20.34a8.5 8.5 0 0 1-3.32 0M7.28 19.07a8.5 8.5 0 0 1-2.35-2.35M3.66 13.66a8.5 8.5 0 0 1 0-3.32M4.93 7.28a8.5 8.5 0 0 1 2.35-2.35",
)
/** A numbered list: 1, 2, 3 beside three lines. */
export const ListOrdered = glyph(
  "ListOrdered",
  "M10.5 6h10M10.5 12h10M10.5 18h10M4.25 4.75 5.25 4v4M4.25 8h2M4 10.9a1.1 1.1 0 0 1 2.15.3c0 .8-2.15 1.6-2.15 2.8h2.25M4 16.1a1.1 1.1 0 1 1 1.1 1.4 1.1 1.1 0 1 1-1.1 1.4",
)
