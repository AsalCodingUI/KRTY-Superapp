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
  "M2.88 9.185h13.68v6.27a5.13 5.13 0 0 1 -5.13 5.13h-3.42A5.13 5.13 0 0 1 2.88 15.455ZM16.56 10.895h1.425a3.135 3.135 0 0 1 0 6.27H16.56M7.44 2.915v2.85M12 2.915v2.85",
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
  "M3.292 19.617L3.292 10.311A1.633 1.633 0 0 1 3.88 9.059L10.955 3.181A1.633 1.633 0 0 1 13.045 3.181L20.12 9.059A1.633 1.633 0 0 1 20.708 10.311L20.708 19.617A1.633 1.633 0 0 1 19.075 21.25L4.925 21.25A1.633 1.633 0 0 1 3.292 19.617ZM9.551 21.25v-4.354a2.449 2.449 0 0 1 4.898 0v4.354",
)
export const CalendarDays = glyph(
  "CalendarDays",
  "M3.75 8a3 3 0 0 1 3-3h10.5a3 3 0 0 1 3 3v9.5a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3ZM3.75 10h16.5M8 3v4M16 3v4",
)
export const Folder = glyph(
  "Folder",
  "M2.75 6.559a3.265 3.265 0 0 1 3.265 -3.265h2.884a2.176 2.176 0 0 1 1.741 0.871l1.197 1.524a2.176 2.176 0 0 0 1.741 0.871h4.407a3.265 3.265 0 0 1 3.265 3.265v7.618a3.265 3.265 0 0 1 -3.265 3.265h-11.971a3.265 3.265 0 0 1 -3.265 -3.265Z",
)
export const Search = glyph(
  "Search",
  "M17.875 10.562a7.312 7.312 0 1 1 -14.625 0 7.312 7.312 0 0 1 14.625 0ZM15.906 15.906l5.344 5.344",
)
export const Bell = glyph(
  "Bell",
  "M5.75 9.01a6.25 6.25 0 0 1 12.501 0L18.25 13.413A1.631 1.631 0 0 0 18.522 14.315L18.739 14.63A1.631 1.631 0 0 1 17.381 17.163L6.619 17.163A1.631 1.631 0 0 1 5.261 14.63L5.478 14.315A1.631 1.631 0 0 0 5.75 13.413L5.75 9.01ZM9.826 20.424a3.261 3.261 0 0 0 4.348 0",
)
export const Settings = glyph(
  "Settings",
  "M9.965 5.032L10.099 4.076A1.542 1.542 0 0 1 11.63 2.75L12.37 2.75A1.542 1.542 0 0 1 13.901 4.076L14.035 5.032A1.542 1.542 0 0 0 14.796 6.152L15.669 6.656A1.542 1.542 0 0 0 17.016 6.758L17.91 6.388A1.542 1.542 0 0 1 19.821 7.056L20.191 7.704A1.542 1.542 0 0 1 19.811 9.688L19.051 10.284A1.542 1.542 0 0 0 18.454 11.496L18.454 12.504A1.542 1.542 0 0 0 19.051 13.716L19.811 14.312A1.542 1.542 0 0 1 20.191 16.296L19.821 16.944A1.542 1.542 0 0 1 17.91 17.612L17.016 17.242A1.542 1.542 0 0 0 15.669 17.344L14.796 17.848A1.542 1.542 0 0 0 14.035 18.968L13.901 19.924A1.542 1.542 0 0 1 12.37 21.25L11.63 21.25A1.542 1.542 0 0 1 10.099 19.924L9.965 18.968A1.542 1.542 0 0 0 9.204 17.848L8.331 17.344A1.542 1.542 0 0 0 6.984 17.242L6.09 17.612A1.542 1.542 0 0 1 4.179 16.944L3.809 16.296A1.542 1.542 0 0 1 4.189 14.312L4.949 13.716A1.542 1.542 0 0 0 5.546 12.504L5.546 11.496A1.542 1.542 0 0 0 4.949 10.284L4.189 9.688A1.542 1.542 0 0 1 3.809 7.704L4.179 7.056A1.542 1.542 0 0 1 6.09 6.388L6.984 6.758A1.542 1.542 0 0 0 8.331 6.656L9.204 6.152A1.542 1.542 0 0 0 9.965 5.032ZM14.569 12a2.569 2.569 0 1 1 -5.139 0 2.569 2.569 0 0 1 5.139 0Z",
)
export const Users = glyph(
  "Users",
  "M12.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM3 20a6 6 0 0 1 12 0M15.5 4.2a3.5 3.5 0 0 1 0 6.6M17.5 14.3A6 6 0 0 1 21 20",
)
export const Check = glyph("Check", "M4.02 12.82 9.15 17.95 19.98 6.55")
export const X = glyph(
  "X",
  "M6.015 6.015l11.97 11.97M17.985 6.015l-11.97 11.97",
)
export const Plus = glyph("Plus", "M12 5v14M5 12h14")
export const ChevronDown = glyph("ChevronDown", "M6.3 9.65l5.7 5.7 5.7 -5.7")
export const ChevronRight = glyph("ChevronRight", "M9.65 6.3l5.7 5.7 -5.7 5.7")
export const ArrowLeft = glyph(
  "ArrowLeft",
  "M19 12H5.5M11 6.25 5.25 12 11 17.75",
)
export const Trash2 = glyph(
  "Trash2",
  "M3.284 6.269h17.433M9.276 3h5.448M5.463 6.269l0.872 12.421a2.724 2.724 0 0 0 2.724 2.56h5.884a2.724 2.724 0 0 0 2.724 -2.56L18.537 6.269M9.821 10.627v5.993M14.179 10.627v5.993",
)
export const Pencil = glyph(
  "Pencil",
  "M2.91 21.09l1.026 -4.674a2.28 2.28 0 0 1 0.616 -1.117L15.792 4.047a2.394 2.394 0 0 1 3.386 0l0.775 0.775a2.394 2.394 0 0 1 0 3.386l-11.252 11.24a2.28 2.28 0 0 1 -1.117 0.616ZM14.025 5.814l4.161 4.161",
)
export const Link = glyph(
  "Link",
  "M10.005 13.995a4.56 4.56 0 0 0 6.452 0l3.42 -3.42a4.56 4.56 0 0 0 -6.452 -6.452l-1.254 1.254M13.995 10.005a4.56 4.56 0 0 0 -6.452 0l-3.42 3.42a4.56 4.56 0 0 0 6.452 6.452l1.254 -1.254",
)
export const Copy = glyph(
  "Copy",
  "M11.456 8.191H17.985A3.265 3.265 0 0 1 21.25 11.456V17.985A3.265 3.265 0 0 1 17.985 21.25H11.456A3.265 3.265 0 0 1 8.191 17.985V11.456A3.265 3.265 0 0 1 11.456 8.191ZM15.809 8.191v-2.176a3.265 3.265 0 0 0 -3.265 -3.265h-6.529a3.265 3.265 0 0 0 -3.265 3.265v6.529a3.265 3.265 0 0 0 3.265 3.265h2.176",
)
export const MoreHorizontal = dots("MoreHorizontal", [5.5, 12, 18.5], [12])
export const FileText = glyph(
  "FileText",
  "M13.632 2.75H7.103a3.265 3.265 0 0 0 -3.265 3.265v11.971a3.265 3.265 0 0 0 3.265 3.265h9.794a3.265 3.265 0 0 0 3.265 -3.265V9.279ZM13.632 2.75v4.353a2.176 2.176 0 0 0 2.176 2.176h4.353M8.191 13.36h7.618M8.191 16.897h4.897",
)
export const Clock = glyph(
  "Clock",
  "M21.25 12a9.25 9.25 0 1 1 -18.5 0 9.25 9.25 0 0 1 18.5 0ZM12 7.103V12l3.265 2.176",
)

/* Where the Untitled glyph didn't match the app's meaning. */
export const CircleDot = glyph(
  "CircleDot",
  "M21.25 12a9.25 9.25 0 1 1 -18.5 0 9.25 9.25 0 0 1 18.5 0ZM14.721 12a2.721 2.721 0 1 1 -5.441 0 2.721 2.721 0 0 1 5.441 0Z",
)
/** Eight arcs of the r 8.5 circle, round-capped, so it reads dashed. */
export const CircleDashed = glyph(
  "CircleDashed",
  "M10.194 2.924a9.25 9.25 0 0 1 3.613 0M17.136 4.306a9.25 9.25 0 0 1 2.557 2.557M21.076 10.194a9.25 9.25 0 0 1 0 3.613M19.694 17.136a9.25 9.25 0 0 1 -2.557 2.557M13.806 21.076a9.25 9.25 0 0 1 -3.613 0M6.864 19.694a9.25 9.25 0 0 1 -2.557 -2.557M2.924 13.806a9.25 9.25 0 0 1 0 -3.613M4.306 6.864a9.25 9.25 0 0 1 2.557 -2.557",
)
/** A numbered list: 1, 2, 3 beside three lines. */
export const ListOrdered = glyph(
  "ListOrdered",
  "M10.5 6h10M10.5 12h10M10.5 18h10M4.25 4.75 5.25 4v4M4.25 8h2M4 10.9a1.1 1.1 0 0 1 2.15.3c0 .8-2.15 1.6-2.15 2.8h2.25M4 16.1a1.1 1.1 0 1 1 1.1 1.4 1.1 1.1 0 1 1-1.1 1.4",
)
