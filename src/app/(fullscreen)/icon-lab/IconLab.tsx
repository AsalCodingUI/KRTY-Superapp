"use client"

import * as AppIcons from "@/components/icons"
import { STEADY_STROKE, STROKE } from "@/components/icons/custom"
import { cn } from "@/lib/utils"
import * as Untitled from "@untitledui/icons"
import type { ComponentType } from "react"
import { UNTITLED_BASE } from "./untitled-base"

type Glyph = ComponentType<{
  className?: string
  strokeWidth?: number
  "aria-hidden"?: boolean
}> & { ours?: boolean }

const asGlyph = (value: unknown) =>
  typeof value === "object" && value !== null && "$$typeof" in value
    ? (value as Glyph)
    : typeof value === "function"
      ? (value as Glyph)
      : null

/** The whole Untitled UI pack, in its own (alphabetical) order. */
const PACK = Object.entries(Untitled as Record<string, unknown>)
  .filter(([name]) => /^[A-Z]/.test(name))
  .flatMap(([name, value]) => {
    const glyph = asGlyph(value)
    return glyph ? [[name, glyph] as const] : []
  })

/**
 * Our redrawn icons, keyed by the Untitled glyph they replace (an app icon
 * drawn in components/icons/custom.tsx whose base is that glyph).
 */
const OURS = new Map<Glyph, Glyph>()
for (const [name, Base] of Object.entries(UNTITLED_BASE)) {
  const app = asGlyph((AppIcons as Record<string, unknown>)[name])
  if (app?.ours) OURS.set(Base as Glyph, app)
}

/** Untitled glyphs the app uses today (through @/components/icons). */
const USED = new Set<unknown>(Object.values(UNTITLED_BASE))

/**
 * Every Untitled UI icon as a tile, no names: the base we redraw from.
 * A redrawn one shows ours, with the Untitled original on hover and a dot
 * in the corner. Icons the app uses are on a darker tile.
 */
export function IconLab() {
  return (
    <main className="bg-background text-foreground min-h-dvh p-4 md:p-8">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
        {PACK.map(([name, Base]) => {
          const Ours = OURS.get(Base)
          return (
            <li
              key={name}
              aria-label={name}
              className={cn(
                "group/tile rounded-card relative flex aspect-square items-center justify-center",
                USED.has(Base) ? "bg-accent" : "bg-muted",
              )}
            >
              {Ours && (
                <span
                  aria-hidden
                  className="bg-primary absolute top-2.5 right-2.5 size-1.5 rounded-full"
                />
              )}
              {Ours && (
                <Ours className="size-6 transition-opacity duration-150 group-hover/tile:opacity-0" />
              )}
              <Base
                aria-hidden
                strokeWidth={STROKE}
                className={cn(
                  STEADY_STROKE,
                  "size-6",
                  Ours &&
                    "absolute inset-0 m-auto opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100",
                )}
              />
            </li>
          )
        })}
      </ul>
    </main>
  )
}
