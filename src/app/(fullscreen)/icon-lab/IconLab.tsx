"use client"

import * as AppIcons from "@/components/icons"
import { STEADY_STROKE, STROKE } from "@/components/icons/custom"
import { cn } from "@/lib/utils"
import type { ComponentType } from "react"
import { UNTITLED_BASE } from "./untitled-base"

type Glyph = ComponentType<{ className?: string }> & { ours?: boolean }

/** Every icon component @/components/icons exports, in its order. */
const ICONS = Object.entries(AppIcons as Record<string, unknown>)
  .filter(
    ([name, value]) =>
      /^[A-Z]/.test(name) &&
      typeof value === "object" &&
      value !== null &&
      "$$typeof" in value,
  )
  .map(([name, value]) => [name, value as Glyph] as const)

/**
 * Tiles of every app icon, no names. Hover shows the Untitled UI glyph it
 * is based on (same stroke, so only the drawing differs). A dot in the
 * corner: redrawn by us (drawn in components/icons/custom.tsx).
 */
export function IconLab() {
  return (
    <main className="bg-background text-foreground min-h-dvh p-4 md:p-8">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
        {ICONS.map(([name, Icon]) => {
          const Base = UNTITLED_BASE[name] as
            | ComponentType<{ className?: string; strokeWidth?: number }>
            | undefined
          return (
            <li
              key={name}
              aria-label={name}
              className="group/tile bg-muted rounded-card relative flex aspect-square items-center justify-center"
            >
              {Icon.ours && (
                <span
                  aria-hidden
                  className="bg-primary absolute top-2.5 right-2.5 size-1.5 rounded-full"
                />
              )}
              {/* Ours; on hover, the Untitled UI base in its place. */}
              <Icon
                className={cn(
                  "size-6 transition-opacity duration-150",
                  Base && "group-hover/tile:opacity-0",
                )}
              />
              {Base && (
                <Base
                  aria-hidden
                  strokeWidth={STROKE}
                  className={cn(
                    STEADY_STROKE,
                    "absolute inset-0 m-auto size-6 opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100",
                  )}
                />
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
