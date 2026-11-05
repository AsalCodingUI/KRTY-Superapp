"use client"

import { Bell, Plus, Search, Settings } from "@/components/icons"
import { cn } from "@/lib/utils"
// Raw glyphs only to draw the old scaling stroke in "Sebelum".
import { Bell01 } from "@untitledui/icons/Bell01"
import { Plus as RawPlus } from "@untitledui/icons/Plus"
import { SearchMd } from "@untitledui/icons/SearchMd"
import { Settings01 } from "@untitledui/icons/Settings01"
import { useEffect, useRef, useState } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Icons, "Sebelum / sesudah": the icon stroke that scaled with the
 * icon (1.75 on 24px, thin when small) vs the fixed 1.25px now, and the
 * stroke actually drawn at each size, read from the page.
 */

const SIZES = ["size-3", "size-3.5", "size-4", "size-5"] as const

export function IconsCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Garis ikon ikut ukuran → 1.25px tetap (0.9 × stem teks)"
        before={
          <div className="flex flex-col gap-3">
            {SIZES.map((s) => (
              <span key={s} className="text-body flex items-center gap-2">
                {[Bell01, SearchMd, Settings01, RawPlus].map((G, i) => (
                  <G key={i} aria-hidden className={s} strokeWidth="1.75" />
                ))}
                <code className="text-tertiary-foreground text-caption font-mono">
                  {s}
                </code>
              </span>
            ))}
          </div>
        }
        after={
          <div className="flex flex-col gap-3">
            {SIZES.map((s) => (
              <span key={s} className="text-body flex items-center gap-2">
                {[Bell, Search, Settings, Plus].map((G, i) => (
                  <G key={i} className={s} />
                ))}
                <code className="text-tertiary-foreground text-caption font-mono">
                  {s}
                </code>
              </span>
            ))}
          </div>
        }
      />
      <Measured />
    </div>
  )
}

/** The stroke drawn on screen per icon size, before and now. */
function Measured() {
  const old = useRef<(HTMLSpanElement | null)[]>([])
  const now = useRef<(HTMLSpanElement | null)[]>([])
  const [rows, setRows] = useState<string[]>([])
  useEffect(() => {
    setRows(
      SIZES.map((_, i) => {
        const o = old.current[i]?.querySelector("svg")
        const n = now.current[i]?.querySelector("svg")
        if (!o || !n) return ""
        const px = (el: SVGSVGElement) => el.getBoundingClientRect().width
        const oldStroke = (1.75 * px(o)) / 24
        const path = n.querySelector("path, circle, rect, line")
        const steady =
          path && getComputedStyle(path).vectorEffect === "non-scaling-stroke"
        const nowStroke = steady
          ? parseFloat(n.getAttribute("stroke-width") ?? "0")
          : (parseFloat(n.getAttribute("stroke-width") ?? "0") * px(n)) / 24
        return `${px(n)}px: ${oldStroke.toFixed(2)}px → ${nowStroke.toFixed(2)}px`
      }),
    )
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {SIZES.map((s, i) => (
            <div
              key={s}
              className="gutter-x grid min-h-12 grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-4 py-2"
            >
              <code className="text-caption font-mono">{s}</code>
              <span className="text-muted-foreground text-meta tabular-nums">
                {rows[i] || "…"} (stem teks 14px: 1.40px)
              </span>
              <span
                aria-hidden
                className="sr-only"
                ref={(el) => {
                  old.current[i] = el
                }}
              >
                <SearchMd className={cn(s, "inline")} />
              </span>
              <span
                aria-hidden
                className="sr-only"
                ref={(el) => {
                  now.current[i] = el
                }}
              >
                <Search className={s} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
