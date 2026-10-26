"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePinchZoom } from "@/shared/hooks/usePinchZoom"
import { useT } from "@/shared/i18n/client"
import { RiAddLine, RiSubtractFill } from "@/shared/ui/lucide-icons"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

const STEP = 1.25

/**
 * A scroll area whose content can be pinch-zoomed on a trackpad (and panned
 * with two fingers, as plain scrolling). The children get the zoom and the
 * view's size, and make their box grow with it (a width, CSS `zoom`…).
 * A small −/%/+ pill shows while zoomed; the % puts it back to fit.
 */
export function Zoomable({
  children,
  className,
  scrollClassName,
  min = 0.5,
  max = 5,
  overlay,
}: {
  children: (
    zoom: number,
    view: { width: number; height: number },
  ) => React.ReactNode
  className?: string
  scrollClassName?: string
  min?: number
  max?: number
  /** Extra controls over the view (e.g. background swatches). */
  overlay?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [view, setView] = useState({ width: 0, height: 0 })
  const zoomTo = usePinchZoom(ref, { zoom, setZoom, min, max })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setView({
        width: Math.floor(entry.contentRect.width),
        height: Math.floor(entry.contentRect.height),
      }),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={cn("relative min-h-0", className)}>
      <div ref={ref} className={cn("size-full overflow-auto", scrollClassName)}>
        {view.width > 0 && children(zoom, view)}
      </div>
      {overlay}
      <ZoomPill zoom={zoom} zoomTo={zoomTo} />
    </div>
  )
}

/**
 * −/%/+ controls, shown only while zoomed (bottom right of a relative
 * parent). The % puts the view back to fit.
 */
export function ZoomPill({
  zoom,
  zoomTo,
  className,
}: {
  zoom: number
  zoomTo: (zoom: number) => void
  className?: string
}) {
  const t = useT("common")
  const reduce = useReducedMotion()
  const zoomed = Math.abs(zoom - 1) > 0.01
  return (
    <AnimatePresence>
      {zoomed && (
        <m.div
          initial={reduce ? false : { opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            "bg-popover text-popover-foreground absolute right-3 bottom-3 z-10 flex items-center gap-0.5 rounded-full p-1 shadow-(--elev-3)",
            className,
          )}
        >
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t("zoomOut")}
            title={t("zoomOut")}
            onClick={() => zoomTo(zoom / STEP)}
          >
            <RiSubtractFill />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title={t("zoomReset")}
            className="min-w-14 px-2 text-xs tabular-nums"
            onClick={() => zoomTo(1)}
          >
            {Math.round(zoom * 100)}%
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t("zoomIn")}
            title={t("zoomIn")}
            onClick={() => zoomTo(zoom * STEP)}
          >
            <RiAddLine />
          </Button>
        </m.div>
      )}
    </AnimatePresence>
  )
}

export type PreviewBackground =
  | "checker"
  | "light"
  | "dark"
  | "pink"
  | "lilac"
  | "rose"
  | "peach"

/** Swatch fill and the label key for each background. */
const BACKGROUNDS: Record<
  PreviewBackground,
  {
    style: React.CSSProperties
    label:
      | "bgChecker"
      | "bgLight"
      | "bgDark"
      | "bgPink"
      | "bgLilac"
      | "bgRose"
      | "bgPeach"
  }
> = {
  checker: {
    label: "bgChecker",
    style: {
      backgroundColor: "#fff",
      backgroundImage:
        "conic-gradient(#e6e6e6 25%, #fff 0 50%, #e6e6e6 0 75%, #fff 0)",
      backgroundSize: "16px 16px",
    },
  },
  light: { label: "bgLight", style: { backgroundColor: "#f2f2f2" } },
  dark: { label: "bgDark", style: { backgroundColor: "#1c1c1e" } },
  pink: { label: "bgPink", style: { backgroundColor: "#e5a6c3" } },
  lilac: { label: "bgLilac", style: { backgroundColor: "#d39be0" } },
  rose: { label: "bgRose", style: { backgroundColor: "#e88f9a" } },
  peach: { label: "bgPeach", style: { backgroundColor: "#e89c74" } },
}

const BG_KEY = "preview-background"

/** The chosen preview background, remembered on this device. */
export function usePreviewBackground() {
  const [bg, setBg] = useState<PreviewBackground>("checker")
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BG_KEY) as PreviewBackground | null
      if (saved && saved in BACKGROUNDS) setBg(saved)
    } catch {}
  }, [])
  const choose = (next: PreviewBackground) => {
    setBg(next)
    try {
      localStorage.setItem(BG_KEY, next)
    } catch {}
  }
  return [bg, choose, BACKGROUNDS[bg].style] as const
}

/**
 * Round swatches (top right) to change the backdrop behind an image, so
 * white SVGs or transparent PNGs stay visible.
 */
export function BackgroundSwatches({
  value,
  onChange,
  className,
}: {
  value: PreviewBackground
  onChange: (bg: PreviewBackground) => void
  className?: string
}) {
  const t = useT("common")
  return (
    <div
      role="radiogroup"
      aria-label={t("previewBackground")}
      className={cn(
        "bg-popover absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full p-1.5 shadow-(--elev-3)",
        className,
      )}
    >
      {(Object.keys(BACKGROUNDS) as PreviewBackground[]).map((key) => {
        const active = key === value
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(BACKGROUNDS[key].label)}
            title={t(BACKGROUNDS[key].label)}
            onClick={() => onChange(key)}
            // The checker is drawn finer inside the small dot.
            style={
              key === "checker"
                ? { ...BACKGROUNDS.checker.style, backgroundSize: "8px 8px" }
                : BACKGROUNDS[key].style
            }
            className={cn(
              // The active ring is drawn inside the dot's own box, so it
              // never runs into a neighbour or past the pill.
              "focus-visible:ring-focus-ring size-6 cursor-pointer rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)] transition-shadow duration-150 ease-out outline-none focus-visible:ring-2 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.15)]",
              active &&
                "shadow-[inset_0_0_0_2px_var(--color-foreground),inset_0_0_0_4px_var(--color-popover)]! dark:shadow-[inset_0_0_0_2px_rgb(255_255_255/0.85),inset_0_0_0_4px_var(--color-popover)]!",
            )}
          />
        )
      })}
    </div>
  )
}

/** Formats that may have see-through pixels (everything but JPEG). */
/** Only SVGs get the backdrop swatches: they're usually artwork on nothing
 *  (a logo) that needs a backdrop to be seen; photos and PNGs show as is. */
function isSvg(name?: string | null, mime?: string | null) {
  return mime === "image/svg+xml" || /\.svg$/i.test(name ?? "")
}

/**
 * An image that fits the view at 100% and pinch-zooms from there, on a
 * background the viewer can switch (SVGs only).
 */
export function ZoomableImage({
  src,
  alt = "",
  name,
  mime,
  className,
}: {
  src: string
  alt?: string
  /** File name / type: only an SVG gets the backdrop swatches. */
  name?: string | null
  mime?: string | null
  className?: string
}) {
  const transparent = isSvg(name, mime)
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [bg, setBg, bgStyle] = usePreviewBackground()
  const PAD = 48
  return (
    <Zoomable
      className={className}
      min={0.5}
      max={8}
      overlay={
        transparent ? (
          <BackgroundSwatches value={bg} onChange={setBg} />
        ) : undefined
      }
    >
      {(zoom, view) => {
        // Fit inside the padded view, never upscaled past its own size.
        const fit = natural
          ? Math.min(
              1,
              (view.width - PAD * 2) / natural.w,
              (view.height - PAD * 2) / natural.h,
            )
          : 0
        const w = natural ? natural.w * fit * zoom : undefined
        return (
          <div
            className="flex min-h-full w-max min-w-full items-center justify-center"
            style={{ padding: PAD }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- signed / blob URL */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget
                // SVGs without a size report 0; give them a sensible box.
                setNatural({
                  w: img.naturalWidth || 800,
                  h: img.naturalHeight || 800,
                })
              }}
              style={{
                ...(transparent ? bgStyle : null),
                width: w,
                opacity: natural ? 1 : 0,
              }}
              className="block max-w-none rounded-[4px] shadow-(--elev-3) transition-[background-color] duration-200"
            />
          </div>
        )
      }}
    </Zoomable>
  )
}
