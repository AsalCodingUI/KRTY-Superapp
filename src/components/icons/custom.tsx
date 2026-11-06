/**
 * The app's icon stroke, and the glyph Untitled UI's
 * free set doesn't have, drawn the same way (24px, round caps and joins,
 * no fill) so it sits with the rest.
 */
import type { SVGProps } from "react"

/** The icons' stroke on their 24px grid: 1.5. It scales with the icon
 *  (through VIEWBOX: ~1.15px at size-4, 2.3 at 32px), so every size is the
 *  same drawing, just bigger or smaller (docs/ui/icons.md). */
export const STROKE = 1.5

/** The box every glyph is shown in: the 24 grid less 1.5 on each side,
 *  so the drawing (stroke centres 2.5–21.5 at most, the stroke reaching 1.5
 *  and 22.5) fills the icon box instead of leaving 2px of air around it.
 *  At size-4 a full-size glyph is ~15px
 *  (docs/ui/icons.md). Every glyph must stay inside 2.5–21.5. */
export const VIEWBOX = "1.5 1.5 21 21"

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
      viewBox={VIEWBOX}
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

/** A mug with steam (breaks): an 11.5 × 12 body, square-ish rim (r 1),
 *  round base (r 3.5), a 5.5-tall handle, and two soft S-wisps over the
 *  body's centre, 2.25 above the rim; the whole mug centred (4.25–19.75). */
export const Coffee = glyph(
  "Coffee",
  "M5.25 8.75h9.5a1 1 0 0 1 1 1v7.5a3.5 3.5 0 0 1-3.5 3.5h-4a3.5 3.5 0 0 1-3.5-3.5v-7.5a1 1 0 0 1 1-1ZM15.75 11h1.25a2.75 2.75 0 0 1 0 5.5h-1.25M8 6.5C6.75 5.5 9.25 4 8 3M12 6.5C10.75 5.5 13.25 4 12 3",
)

/** One four-point sparkle across the live area (the Stars family's
 *  shape: tips at 2.75 and 21.25, waist at 9 % / 36 % of the reach). The
 *  path is exported for glyphs that stroke it with a gradient. */
export const SPARKLE_D =
  "M12 2.75C12.832 8.67 15.33 11.168 21.25 12C15.33 12.832 12.832 15.33 12 21.25C11.168 15.33 8.67 12.832 2.75 12C8.67 11.168 11.168 8.67 12 2.75Z"
export const Sparkle = glyph("Sparkle", SPARKLE_D)

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
    <svg viewBox={VIEWBOX} width={size} height={size} fill={color} {...props}>
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
  "M3.75 8A3 3 0 0 1 6.75 5H17.25A3 3 0 0 1 20.25 8V17.5A3 3 0 0 1 17.25 20.5H6.75A3 3 0 0 1 3.75 17.5ZM3.75 10H20.25M8 3V6.5M16 3V6.5M7.75 15.25A0.25 0.25 0 0 0 8.25 15.25A0.25 0.25 0 0 0 7.75 15.25M11.75 15.25A0.25 0.25 0 0 0 12.25 15.25A0.25 0.25 0 0 0 11.75 15.25M15.75 15.25A0.25 0.25 0 0 0 16.25 15.25A0.25 0.25 0 0 0 15.75 15.25",
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
  "M18 8.83A6 6 0 0 0 6 8.83V13.23L4.55 14.98A0.9 0.9 0 0 0 5.25 16.45H18.75A0.9 0.9 0 0 0 19.45 14.98L18 13.23ZM9.75 19.95A2.6 2.6 0 0 0 14.25 19.95",
)
export const Settings = glyph(
  "Settings",
  "M9.965 5.032L10.099 4.076A1.542 1.542 0 0 1 11.63 2.75L12.37 2.75A1.542 1.542 0 0 1 13.901 4.076L14.035 5.032A1.542 1.542 0 0 0 14.796 6.152L15.669 6.656A1.542 1.542 0 0 0 17.016 6.758L17.91 6.388A1.542 1.542 0 0 1 19.821 7.056L20.191 7.704A1.542 1.542 0 0 1 19.811 9.688L19.051 10.284A1.542 1.542 0 0 0 18.454 11.496L18.454 12.504A1.542 1.542 0 0 0 19.051 13.716L19.811 14.312A1.542 1.542 0 0 1 20.191 16.296L19.821 16.944A1.542 1.542 0 0 1 17.91 17.612L17.016 17.242A1.542 1.542 0 0 0 15.669 17.344L14.796 17.848A1.542 1.542 0 0 0 14.035 18.968L13.901 19.924A1.542 1.542 0 0 1 12.37 21.25L11.63 21.25A1.542 1.542 0 0 1 10.099 19.924L9.965 18.968A1.542 1.542 0 0 0 9.204 17.848L8.331 17.344A1.542 1.542 0 0 0 6.984 17.242L6.09 17.612A1.542 1.542 0 0 1 4.179 16.944L3.809 16.296A1.542 1.542 0 0 1 4.189 14.312L4.949 13.716A1.542 1.542 0 0 0 5.546 12.504L5.546 11.496A1.542 1.542 0 0 0 4.949 10.284L4.189 9.688A1.542 1.542 0 0 1 3.809 7.704L4.179 7.056A1.542 1.542 0 0 1 6.09 6.388L6.984 6.758A1.542 1.542 0 0 0 8.331 6.656L9.204 6.152A1.542 1.542 0 0 0 9.965 5.032ZM14.569 12a2.569 2.569 0 1 1 -5.139 0 2.569 2.569 0 0 1 5.139 0Z",
)
export const Users = glyph(
  "Users",
  "M12.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM3 20a6 6 0 0 1 12 0M15.5 4.2a3.5 3.5 0 0 1 0 6.6M17.5 14.3A6 6 0 0 1 21 20",
)
export const Check = glyph("Check", "M2.903 12.9 8.751 18.748 21.097 5.752")
export const X = glyph("X", "M6.75 6.75l10.5 10.5M17.25 6.75l-10.5 10.5")
export const Plus = glyph("Plus", "M12 5v14M5 12h14")
export const ChevronDown = glyph(
  "ChevronDown",
  "M5.75 9.375l6.25 6.25 6.25 -6.25",
)
export const ChevronRight = glyph(
  "ChevronRight",
  "M9.375 5.75l6.25 6.25 -6.25 6.25",
)
export const ArrowLeft = glyph(
  "ArrowLeft",
  "M20.25 12L3.75 12M9.76 18.01L3.75 12L9.76 5.99",
)
export const Trash2 = glyph(
  "Trash2",
  "M3.294 6.287h17.412M8.191 6.287V5.471A2.721 2.721 0 0 1 10.912 2.75h2.176A2.721 2.721 0 0 1 15.809 5.471v0.816M5.471 6.287V17.985a3.265 3.265 0 0 0 3.265 3.265h6.529a3.265 3.265 0 0 0 3.265 -3.265V6.287M9.824 10.64v5.985M14.176 10.64v5.985",
)
export const Pencil = glyph(
  "Pencil",
  "M2.75 21.25l1.045 -4.758a2.321 2.321 0 0 1 0.627 -1.137L15.864 3.9a2.437 2.437 0 0 1 3.447 0l0.789 0.789a2.437 2.437 0 0 1 0 3.447l-11.455 11.443a2.321 2.321 0 0 1 -1.137 0.627ZM14.065 5.698l4.236 4.236",
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
  "M7.5 2.75H14.086a1 1 0 0 1 0.707 0.293L19.207 7.457a1 1 0 0 1 0.293 0.707V18.25a3 3 0 0 1-3 3H7.5a3 3 0 0 1-3-3V5.75a3 3 0 0 1 3-3ZM14.5 2.75V6.75a1 1 0 0 0 1 1H19.5M8 13.5h8M8 17h5",
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
  "M11 6.75h9.5M11 17h9.5M3.75 4.5L5.5 3.25V10.25M3.25 15.25a2.25 2.25 0 0 1 4.5 0c0 1.75-4.5 3-4.5 5.5h4.5",
)
