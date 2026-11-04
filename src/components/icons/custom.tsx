/**
 * The app's icon stroke (on the 24px grid), and the glyph Untitled UI's
 * free set doesn't have, drawn the same way (24px, round caps and joins,
 * no fill) so it sits with the rest.
 */
import type { SVGProps } from "react"

export const STROKE = 1.75

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
    >
      <path d={d} />
    </svg>
  )
  Glyph.displayName = name
  return Glyph
}

/** A cup with steam (breaks). */
export const Coffee = glyph(
  "Coffee",
  "M7 3v2M11 3v2M15 3v2M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9ZM17 10h1.5a2.5 2.5 0 0 1 0 5H17M3 22h16",
)
