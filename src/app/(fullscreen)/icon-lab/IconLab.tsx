"use client"

import * as AppIcons from "@/components/icons"
import { Button } from "@/components/ui/button"
import { STROKE } from "@/components/icons/custom"
import { cn } from "@/lib/utils"
import * as Untitled from "@untitledui/icons"
import { type ComponentType, useEffect, useState } from "react"
import { toast } from "sonner"
import * as OurSet from "@/components/icons/set"
import { CHOSEN } from "./chosen"
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

/** The family of a look-alike variant: its name without the number
 *  (Mail01–Mail04 → Mail; Centre spelled Center). */
const stemOf = (name: string) =>
  name.replace(/\d+$/, "").replace("Centre", "Center")

/** Untitled glyphs the app uses today (through @/components/icons). */
const USED = new Set<unknown>(Object.values(UNTITLED_BASE))

/** The pack less the variants not chosen (CHOSEN), unless the app still
 *  uses one. */
const KEPT = PACK.filter(([name, Base]) => {
  const keep = CHOSEN[stemOf(name)]
  return !keep || keep === name || USED.has(Base)
})

/** Look-alike families still to choose from: two or more members, no
 *  choice made yet. */
const FAMILIES = (() => {
  const map = new Map<string, (typeof PACK)[number][]>()
  for (const entry of KEPT) {
    const stem = stemOf(entry[0])
    map.set(stem, [...(map.get(stem) ?? []), entry])
  }
  return [...map].filter(
    ([stem, members]) => members.length > 1 && !CHOSEN[stem],
  )
})()

/** A JSON value kept in this browser between visits (a convenience: the
 *  list itself is what gets copied and sent). */
function useStored<T>(key: string, empty: T) {
  const [value, setValue] = useState<T>(empty)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setValue(JSON.parse(raw) as T)
    } catch {}
  }, [key])
  const save = (next: T) => {
    setValue(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {}
  }
  return [value, save] as const
}

async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(done)
  } catch {
    toast.error("Gagal menyalin")
  }
}

/** One icon: ours (dot in the corner, Untitled on hover) or the Untitled
 *  base; darker when the app uses it; a ring and its name when chosen. */
function Tile({
  name,
  Base,
  on,
  onClick,
}: {
  name: string
  Base: Glyph
  on: boolean
  onClick: () => void
}) {
  const Ours = OURS.get(Base)
  return (
    <button
      type="button"
      aria-label={name}
      aria-pressed={on}
      onClick={onClick}
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
  )
}

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2"
const BAR =
  "bg-popover text-popover-foreground shadow-raised rounded-card fixed inset-x-4 bottom-4 z-10 mx-auto flex max-w-xl items-center gap-2 p-2 pl-4"

/**
 * Two modes. Semua: every Untitled UI icon as a tile (the base we redraw
 * from); click tiles to pick the ones that need work and copy their names.
 * Varian: the look-alike families (Mail01–04, Bell01–04 …) one row each;
 * choose the one to keep per family and copy the choices.
 */
export function IconLab() {
  const [mode, setMode] = useStored<"all" | "variants">("icon-lab:mode", "all")
  const [pickedList, setPickedList] = useStored<string[]>("icon-lab:picked", [])
  const [chosen, setChosen] = useStored<Record<string, string>>(
    "icon-lab:chosen",
    {},
  )
  const [onlyPicked, setOnlyPicked] = useState(false)
  const picked = new Set(pickedList)
  const toggle = (name: string) =>
    setPickedList(
      picked.has(name)
        ? pickedList.filter((n) => n !== name)
        : [...pickedList, name],
    )
  const shown = onlyPicked ? KEPT.filter(([n]) => picked.has(n)) : KEPT
  const done = FAMILIES.filter(([stem]) => chosen[stem]).length

  return (
    <main className="bg-background text-foreground min-h-dvh p-4 pb-24 md:p-8 md:pb-24">
      <div className="mb-4 flex items-center gap-1">
        <Button
          variant={mode === "all" ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={mode === "all"}
          onClick={() => setMode("all")}
        >
          Semua
        </Button>
        <Button
          variant={mode === "variants" ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={mode === "variants"}
          onClick={() => setMode("variants")}
        >
          Varian ({FAMILIES.length})
        </Button>
      </div>

      {mode === "all" ? (
        <ul className={GRID}>
          {shown.map(([name, Base]) => (
            <li key={name}>
              <Tile
                name={name}
                Base={Base}
                on={picked.has(name)}
                onClick={() => toggle(name)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-6">
          {FAMILIES.map(([stem, members]) => (
            <section key={stem}>
              <h2 className="text-meta text-muted-foreground mb-2">
                {stem}
                {chosen[stem] && (
                  <span className="text-foreground"> · {chosen[stem]}</span>
                )}
              </h2>
              <ul className={GRID}>
                {members.map(([name, Base]) => (
                  <li key={name}>
                    <Tile
                      name={name}
                      Base={Base}
                      on={chosen[stem] === name}
                      onClick={() => {
                        const next = { ...chosen }
                        if (next[stem] === name) delete next[stem]
                        else next[stem] = name
                        setChosen(next)
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {mode === "all" && picked.size > 0 && (
        <div className={BAR}>
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
            <Button variant="ghost" size="sm" onClick={() => setPickedList([])}>
              Hapus pilihan
            </Button>
            <Button
              size="sm"
              onClick={() =>
                copyText(
                  KEPT.map(([n]) => n)
                    .filter((n) => picked.has(n))
                    .join(", "),
                  `${picked.size} nama icon disalin`,
                )
              }
            >
              Salin nama
            </Button>
          </div>
        </div>
      )}
      {mode === "variants" && (
        <div className={BAR}>
          <span className="text-sm font-medium tabular-nums">
            {done} / {FAMILIES.length} keluarga dipilih
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={done === 0}
              onClick={() => setChosen({})}
            >
              Hapus pilihan
            </Button>
            <Button
              size="sm"
              disabled={done === 0}
              onClick={() =>
                copyText(
                  FAMILIES.filter(([stem]) => chosen[stem])
                    .map(([stem]) => `${stem}: ${chosen[stem]}`)
                    .join("\n"),
                  `${done} pilihan disalin`,
                )
              }
            >
              Salin pilihan
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
