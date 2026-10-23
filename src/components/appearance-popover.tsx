"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  GRADIENT_PRESETS,
  NEUTRAL,
  readTint,
  sameTint,
  saveTint,
  TINT_PRESETS,
  tintSwatch,
  type Tint,
} from "@/shared/lib/chrome-tint"
import { ChevronLeft, ChevronRight, Moon, Sparkles, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useRef, useState } from "react"

const MODES = [
  { value: "system", label: "themeSystem", icon: Sparkles },
  { value: "light", label: "themeLight", icon: Sun },
  { value: "dark", label: "themeDark", icon: Moon },
] as const

// Faint hue map under the dots: hue left → right, fading out downward
// (bottom = no tint), so the pad hints where each color lives.
const HUES = Array.from(
  { length: 13 },
  (_, i) => `oklch(0.82 0.13 ${i * 30})`,
).join(", ")

/**
 * Arc-style color picker for the app chrome: theme mode, a hue × intensity
 * pad, preset swatches and an intensity slider. Changes apply live.
 */
export function AppearancePopover({ className }: { className?: string }) {
  const t = useT("common")
  const { theme, setTheme } = useTheme()
  const [tint, setTint] = useState<Tint>(NEUTRAL)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setTint(readTint())
    setMounted(true)
  }, [])

  const update = (next: Tint) => {
    setTint(next)
    saveTint(next)
  }

  return (
    <Popover>
      <PopoverTrigger
        // Stable id: sidebar content differs between SSR and hydration while
        // the profile loads, which shifts Base UI's generated ids.
        id="appearance-trigger"
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("appearance")}
            title={t("appearance")}
            className={cn(
              "fill-ink hover:bg-chrome-hover text-muted-foreground hover:text-foreground aria-expanded:bg-sidebar-active size-8 rounded-full aria-expanded:shadow-(--shadow-chrome-active) aria-expanded:before:opacity-0",
              className,
            )}
          />
        }
      >
        <span
          aria-hidden
          className="size-3.5 rounded-full ring-1 ring-black/15 dark:ring-white/20"
          style={{ background: mounted ? tintSwatch(tint) : undefined }}
        />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-72 gap-0 rounded-2xl p-2"
      >
        <TintPad
          tint={tint}
          // On a gradient, the pad turns the whole gradient round the wheel.
          onChange={(next) => {
            if (!tint.g || next.c === 0) return update({ h: next.h, c: next.c })
            const shift = next.h - tint.h
            const turn = (h: number) => (((h + shift) % 360) + 360) % 360
            update({ ...next, g: [turn(tint.g[0]), turn(tint.g[1])] })
          }}
          header={
            <div
              role="radiogroup"
              aria-label={t("theme")}
              className="flex items-center justify-center gap-1"
            >
              {MODES.map(({ value, label, icon: Icon }) => {
                const active = mounted && (theme ?? "system") === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={t(label)}
                    title={t(label)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "focus-visible:ring-ring grid size-8 place-items-center rounded-lg transition-colors outline-none focus-visible:ring-2 [&_svg]:size-4",
                      active
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon aria-hidden />
                  </button>
                )
              })}
            </div>
          }
        />

        <SwatchRail label={t("appearanceColor")}>
          {TINT_PRESETS.map((preset) => (
            <Swatch
              key={`${preset.h}-${preset.c}`}
              tint={preset}
              active={mounted && sameTint(tint, preset)}
              label={
                preset.c === 0
                  ? t("colorNeutral")
                  : `${t("appearanceColor")} ${preset.h}°`
              }
              onSelect={() => update(preset)}
            />
          ))}
          {GRADIENT_PRESETS.map(({ name, tint: preset }) => (
            <Swatch
              key={name}
              tint={preset}
              active={mounted && sameTint(tint, preset)}
              label={`${t("appearanceGradient")} ${name}`}
              onSelect={() => update(preset)}
            />
          ))}
        </SwatchRail>

        <div className="flex flex-col gap-2 px-1.5 pt-4 pb-1.5">
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>{t("intensity")}</span>
            <span className="tabular-nums">{Math.round(tint.c * 100)}%</span>
          </div>
          <Slider
            aria-label={t("intensity")}
            min={0}
            max={100}
            value={[Math.round(tint.c * 100)]}
            onValueChange={(v) => {
              const value = Array.isArray(v) ? v[0] : v
              update({ ...tint, c: value / 100 })
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** Swatches in one row that slides (drag, wheel or the arrows), Arc style. */
function SwatchRail({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const t = useT("common")
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const measure = () => {
    const el = ref.current
    if (!el) return
    setEdges({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    })
  }
  useEffect(() => {
    measure()
    // Start on the chosen swatch.
    ref.current
      ?.querySelector<HTMLElement>("[aria-checked=true]")
      ?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [])
  const page = (dir: 1 | -1) =>
    ref.current?.scrollBy({
      left: dir * ref.current.clientWidth * 0.8,
      behavior: "smooth",
    })
  const arrow =
    "text-muted-foreground hover:text-foreground grid size-6 shrink-0 place-items-center rounded-full transition-[color,opacity] disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-4"

  return (
    <div className="flex items-center gap-1 pt-3">
      <button
        type="button"
        aria-label={t("previous")}
        disabled={edges.start}
        onClick={() => page(-1)}
        className={arrow}
      >
        <ChevronLeft aria-hidden />
      </button>
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        onScroll={measure}
        className="flex min-w-0 flex-1 snap-x snap-mandatory scroll-px-1.5 gap-2.5 overflow-x-auto overscroll-x-contain p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          // Swatches fade out under the arrows instead of being cut.
          maskImage: `linear-gradient(to right, ${edges.start ? "black" : "transparent"}, black 12px, black calc(100% - 12px), ${edges.end ? "black" : "transparent"})`,
        }}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label={t("next")}
        disabled={edges.end}
        onClick={() => page(1)}
        className={arrow}
      >
        <ChevronRight aria-hidden />
      </button>
    </div>
  )
}

/** One preset swatch: a solid color or a gradient. */
function Swatch({
  tint,
  active,
  label,
  onSelect,
}: {
  tint: Tint
  active: boolean
  label: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        onSelect()
        e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })
      }}
      className={cn(
        "focus-visible:ring-ring size-6 shrink-0 snap-start rounded-full ring-1 ring-black/10 transition-transform outline-none focus-visible:ring-2 dark:ring-white/15",
        // The scroller pads 6px: room for the 4px ring + offset, which
        // would clip if the chosen swatch also grew on hover.
        active
          ? "ring-foreground/70 ring-offset-popover ring-2 ring-offset-2 dark:ring-white/70"
          : "hover:scale-110",
      )}
      style={{ background: tintSwatch(tint) }}
    />
  )
}

/** Drag (or arrow keys) to pick hue (x) and intensity (y, top = strongest). */
function TintPad({
  tint,
  onChange,
  header,
}: {
  tint: Tint
  onChange: (tint: Tint) => void
  header: React.ReactNode
}) {
  const t = useT("common")
  // The handle moves inside an inset area so it never clips at the edges.
  const ref = useRef<HTMLDivElement>(null)

  const pick = (e: React.PointerEvent) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    const x = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width))
    const y = Math.min(1, Math.max(0, (e.clientY - box.top) / box.height))
    onChange({
      h: Math.round(x * 359),
      c: Math.round((1 - y) * 100) / 100,
    })
  }

  return (
    <div className="bg-muted/60 relative overflow-hidden rounded-xl">
      <div className="absolute inset-x-0 top-2 z-10">{header}</div>
      <div
        role="slider"
        tabIndex={0}
        aria-label={t("colorPad")}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={tint.h}
        aria-valuetext={`${tint.h}°, ${Math.round(tint.c * 100)}%`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          pick(e)
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e)
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 15 : 5
          const moves: Record<string, Tint> = {
            ArrowLeft: { ...tint, h: (tint.h - step + 360) % 360 },
            ArrowRight: { ...tint, h: (tint.h + step) % 360 },
            ArrowUp: { ...tint, c: Math.min(1, tint.c + step / 100) },
            ArrowDown: { ...tint, c: Math.max(0, tint.c - step / 100) },
          }
          const next = moves[e.key]
          if (!next) return
          e.preventDefault()
          onChange({ h: next.h, c: Math.round(next.c * 100) / 100 })
        }}
        className="focus-visible:ring-ring relative mt-12 h-44 cursor-crosshair touch-none rounded-b-xl outline-none focus-visible:ring-2 focus-visible:ring-inset"
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 dark:opacity-25"
          style={{
            background: `linear-gradient(to right, ${HUES})`,
            maskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
        <div
          aria-hidden
          className="text-foreground/15 absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }}
        />
        <div
          ref={ref}
          aria-hidden
          className="pointer-events-none absolute inset-4"
        >
          <span
            className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md"
            style={{
              left: `${(tint.h / 359) * 100}%`,
              top: `${(1 - tint.c) * 100}%`,
              background: tintSwatch(tint),
            }}
          />
        </div>
      </div>
    </div>
  )
}
