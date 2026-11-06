"use client"

import * as AppIcons from "@/components/icons"
import { Button } from "@/components/ui/button"
import { STROKE } from "@/components/icons/custom"
import { cn } from "@/lib/utils"
import * as Untitled from "@untitledui/icons"
import { type ComponentType, useEffect, useState } from "react"
import { toast } from "sonner"
import * as OurSet from "@/components/icons/set"
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

/**
 * A circle glyph with a square twin (CheckCircle / CheckSquare): we keep
 * the square one only, so the circle isn't drawn or shown.
 */
const hasSquareTwin = (name: string) =>
  name !== "Circle" &&
  name.includes("Circle") &&
  name.replace("Circle", "Square") in Untitled

/** The whole Untitled UI pack, in its own (alphabetical) order. */
const PACK = Object.entries(Untitled as Record<string, unknown>)
  .filter(([name]) => /^[A-Z]/.test(name) && !hasSquareTwin(name))
  .flatMap(([name, value]) => {
    const glyph = asGlyph(value)
    return glyph ? [[name, glyph] as const] : []
  })

/**
 * Our redrawn icons, keyed by the Untitled glyph they replace (an app icon
 * drawn in components/icons/custom.tsx whose base is that glyph).
 */
const OURS = new Map<Glyph, Glyph>()
// The app's own icons first (what it really shows), then the rest of our
// set, which is named after the Untitled glyph it redraws.
for (const [name, Base] of Object.entries(UNTITLED_BASE)) {
  const app = asGlyph((AppIcons as Record<string, unknown>)[name])
  if (app?.ours) OURS.set(Base as Glyph, app)
}
for (const [name, value] of Object.entries(OurSet as Record<string, unknown>)) {
  const base = asGlyph((Untitled as Record<string, unknown>)[name])
  const ours = asGlyph(value)
  if (base && ours && !OURS.has(base)) OURS.set(base, ours)
}

/** Untitled glyphs the app uses today (through @/components/icons). */
const USED = new Set<unknown>(Object.values(UNTITLED_BASE))

/** The picked tiles, kept in this browser between visits (a convenience:
 *  the list itself is what gets copied and sent). */
const PICKED_KEY = "icon-lab:picked"

function usePicked() {
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PICKED_KEY)
      if (raw) setPicked(new Set(JSON.parse(raw) as string[]))
    } catch {}
  }, [])
  const save = (next: Set<string>) => {
    setPicked(next)
    try {
      localStorage.setItem(PICKED_KEY, JSON.stringify([...next]))
    } catch {}
  }
  const toggle = (name: string) => {
    const next = new Set(picked)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    save(next)
  }
  return { picked, toggle, clear: () => save(new Set()) }
}

/**
 * Every Untitled UI icon as a tile, no names: the base we redraw from.
 * A redrawn one shows ours, with the Untitled original on hover and a dot
 * in the corner. Icons the app uses are on a darker tile. Click tiles to
 * pick the ones that need work; the bar at the bottom copies their names.
 */
export function IconLab() {
  const { picked, toggle, clear } = usePicked()
  const [onlyPicked, setOnlyPicked] = useState(false)
  const shown = onlyPicked ? PACK.filter(([n]) => picked.has(n)) : PACK
  const copy = async () => {
    const list = PACK.map(([n]) => n).filter((n) => picked.has(n))
    try {
      await navigator.clipboard.writeText(list.join(", "))
      toast.success(`${list.length} nama icon disalin`)
    } catch {
      toast.error("Gagal menyalin")
    }
  }
  return (
    <main className="bg-background text-foreground min-h-dvh p-4 pb-24 md:p-8 md:pb-24">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
        {shown.map(([name, Base]) => {
          const Ours = OURS.get(Base)
          const on = picked.has(name)
          return (
            <li key={name}>
              <button
                type="button"
                aria-label={name}
                aria-pressed={on}
                onClick={() => toggle(name)}
                className={cn(
                  "group/tile rounded-card focus-visible:ring-ring relative flex aspect-square w-full items-center justify-center outline-none focus-visible:ring-2",
                  USED.has(Base) ? "bg-accent" : "bg-muted",
                  on && "ring-primary ring-2",
                )}
              >
                {Ours && (
                  <span
                    aria-hidden
                    className="bg-primary absolute top-2.5 right-2.5 size-1.5 rounded-full"
                  />
                )}
                {on && (
                  <span className="text-primary text-micro absolute inset-x-1 bottom-1.5 truncate leading-none">
                    {name}
                  </span>
                )}
                {Ours && (
                  <Ours className="size-6 transition-opacity duration-150 group-hover/tile:opacity-0" />
                )}
                <Base
                  aria-hidden
                  strokeWidth={STROKE}
                  className={cn(
                    "size-6",
                    Ours &&
                      "absolute inset-0 m-auto opacity-0 transition-opacity duration-150 group-hover/tile:opacity-100",
                  )}
                />
              </button>
            </li>
          )
        })}
      </ul>
      {picked.size > 0 && (
        <div className="bg-popover text-popover-foreground shadow-raised rounded-card fixed inset-x-4 bottom-4 z-10 mx-auto flex max-w-xl items-center gap-2 p-2 pl-4">
          <span className="text-sm font-medium tabular-nums">
            {picked.size} dipilih
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={onlyPicked}
              onClick={() => setOnlyPicked((v) => !v)}
            >
              {onlyPicked ? "Tampilkan semua" : "Lihat yang dipilih"}
            </Button>
            <Button variant="ghost" size="sm" onClick={clear}>
              Hapus pilihan
            </Button>
            <Button size="sm" onClick={copy}>
              Salin nama
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
