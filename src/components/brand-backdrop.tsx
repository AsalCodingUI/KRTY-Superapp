"use client"

import GradientASCII from "@/components/gradient-ascii/GradientASCII"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Behind the minimal screens' card (a brief, sign in, the portal's PIN…): React Bits' GradientASCII in the logo's colors
 * (pink, coral, magenta, lavender), drawn for the current theme. The ramps
 * step gently (in-between tones) and a light grain hides the 8-bit steps,
 * so the gradient reads smooth instead of in bands.
 */
const DARK = [
  "#26081c",
  "#5c1640",
  "#b8326f",
  "#f05a95",
  "#fd7a9a",
  "#f7a3b8",
  "#e9c6f7",
]
// Light: the same glowing dots as dark (the component's own light mode
// draws them in a muddy ink), on a softer, brighter ramp.
const LIGHT = [
  "#f7b6d6",
  "#f994c2",
  "#fb7fb4",
  "#fd76a6",
  "#ff8ea6",
  "#ffb3c7",
  "#f0d4ff",
]

export function BrandBackdrop() {
  const { resolvedTheme } = useTheme()
  // The theme is known only on the client: no canvas until then.
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return null
  const light = resolvedTheme === "light"
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <GradientASCII
        // A new palette needs a fresh canvas.
        key={light ? "light" : "dark"}
        colors={light ? LIGHT : DARK}
        lightMode={false}
        // The intro plays, then it holds still: no frame loop behind the
        // frosted card (its blur would be redone every frame).
        still
        shape="pinch"
        // Small dots only: the big ● sat still like stains once it holds.
        characters=" .·•"
        cellSize={17}
        density={0.52}
        clickEffect="none"
        // No cursor trail: redrawing behind the frosted card made it blink.
        mouseInteraction={false}
        glyphOpacity={light ? 0.5 : 0.61}
        gradientOpacity={light ? 0.7 : 0.84}
        glow={0.15}
        depthOfField={0.56}
        flicker={0.15}
        softness={0.95}
        scale={1.05}
        speed={3}
        grain={0.05}
        variation={7}
        scrambleRadius={0.04}
        // Sharp enough behind a card, lighter on retina screens.
        dpr={1.5}
        style={{}}
      />
    </div>
  )
}
