"use client"

import * as AppIcons from "@/components/icons"
import type { ComponentType } from "react"
import legacy from "./legacy-icons.json"

/**
 * The old glyphs: Reicon 1.2.6 Outline at the old 1.75 stroke, rendered
 * once from the icon map before the Untitled UI switch (git 7f9301d^) to
 * static SVG, so the app doesn't keep the old package.
 */
const LEGACY = legacy as Record<string, string>

type Glyph = ComponentType<{ className?: string }>

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

export function IconLab() {
  return (
    <main className="bg-background text-foreground min-h-dvh p-4 md:p-8">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2">
        {ICONS.map(([name, Icon]) => (
          <li
            key={name}
            aria-label={name}
            className="group/tile bg-muted rounded-card relative flex aspect-square items-center justify-center"
          >
            {/* Now: our icon. Hover: the old one in its place. */}
            <Icon className="size-6 transition-opacity duration-150 group-hover/tile:opacity-0" />
            {LEGACY[name] && (
              <span
                aria-hidden
                className="absolute inset-0 m-auto size-6 opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100 [&_svg]:size-full"
                dangerouslySetInnerHTML={{ __html: LEGACY[name] }}
              />
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
