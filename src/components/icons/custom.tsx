/**
 * The app's icon stroke, and the glyph Untitled UI's
 * free set doesn't have, drawn the same way (24px, round caps and joins,
 * no fill) so it sits with the rest.
 */
import { cn } from "@/lib/utils"
import type { SVGProps } from "react"

/** The icons' stroke in screen px, the same at every size (non-scaling
 *  stroke): 1.25 ≈ 0.9 × Geist's stem at 14px (1.4). An icon packs more
 *  ink in its box than a letter (closed shapes, corners), so an equal
 *  stroke reads heavier; 0.9× makes them weigh like the text beside them
 *  (docs/ui/optical.md). */
export const STROKE = 1.25

/** Keeps the stroke in screen px however big the icon is drawn. */
export const STEADY_STROKE = "[&_*]:[vector-effect:non-scaling-stroke]"

/** Glyphs drawn here carry `ours: true`, and so do the app icons made
 *  from them (index.tsx): /icon-lab marks those as redrawn. */
type GlyphProps = SVGProps<SVGSVGElement> & { size?: number; color?: string }

function glyph(name: string, d: string) {
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
      className={cn(STEADY_STROKE, props.className)}
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
function dots(name: string, xs: number[], ys: number[]) {
  const Dots = ({
    size = 24,
    color = "currentColor",
    strokeWidth: _s,
    ...props
  }: GlyphProps) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} {...props}>
      {ys.flatMap((cy) =>
        xs.map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.75} />),
      )}
    </svg>
  )
  Dots.displayName = name
  ;(Dots as { ours?: boolean }).ours = true
  return Dots
}

export const GripVertical = dots("GripVertical", [9, 15], [5, 12, 19])
export const GripHorizontal = dots("GripHorizontal", [5, 12, 19], [9, 15])
