"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * /ui → Color, "Sebelum / sesudah": what changed in the color system, the
 * old classes drawn on the left, the app's tokens on the right, plus each
 * text token's contrast measured from the live CSS in light and dark.
 */

function BeforeAfter({
  label,
  before,
  after,
}: {
  label: string
  before: ReactNode
  after: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">{label}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["Sebelum", before],
            ["Sesudah", after],
          ] as const
        ).map(([title, node]) => (
          <div key={title} className="flex flex-col gap-2">
            <span className="text-tertiary-foreground text-meta">{title}</span>
            <div className="border-border flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-5">
              {node}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ColorCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Teks peringatan (warning-ink)"
        before={
          <span className="text-warning text-body">
            Terlambat 15 menit · Tenggat hari ini
          </span>
        }
        after={
          <span className="text-warning-ink text-body">
            Terlambat 15 menit · Tenggat hari ini
          </span>
        }
      />
      <BeforeAfter
        label="Teks error (destructive-ink)"
        before={
          <span className="text-destructive text-body">
            Gagal menyimpan, coba lagi
          </span>
        }
        after={
          <span className="text-destructive-ink text-body">
            Gagal menyimpan, coba lagi
          </span>
        }
      />
      <BeforeAfter
        label="Teks berhasil & info (step 11)"
        before={
          <>
            <span className="text-green-9 text-body">Sudah dibayar</span>
            <span className="text-info text-body">Rapat klien</span>
          </>
        }
        after={
          <>
            <span className="text-success-ink text-body">Sudah dibayar</span>
            <span className="text-info-ink text-body">Rapat klien</span>
          </>
        }
      />
      <BeforeAfter
        label="Abu-abu: belasan tingkat → 3"
        before={
          <div className="flex flex-col gap-0.5">
            {[
              "text-foreground/80",
              "text-foreground/70",
              "text-foreground/60",
              "text-muted-foreground/80",
              "text-muted-foreground/60",
              "text-muted-foreground/40",
            ].map((c) => (
              <span key={c} className={cn(c, "text-body")}>
                {c}
              </span>
            ))}
          </div>
        }
        after={
          <div className="flex flex-col gap-0.5">
            {[
              "text-foreground",
              "text-muted-foreground",
              "text-tertiary-foreground",
            ].map((c) => (
              <span key={c} className={cn(c, "text-body")}>
                {c}
              </span>
            ))}
          </div>
        }
      />
      <BeforeAfter
        label="Isian & border tanpa opacity"
        before={
          <>
            <div className="bg-muted/50 text-meta rounded-lg px-3 py-2">
              bg-muted/50
            </div>
            <div className="border-foreground/15 text-meta rounded-lg border px-3 py-2">
              border-foreground/15
            </div>
            <div className="border-border/50 text-meta rounded-lg border px-3 py-2">
              border-border/50
            </div>
          </>
        }
        after={
          <>
            <div className="bg-muted text-meta rounded-lg px-3 py-2">
              bg-muted
            </div>
            <div className="border-field-border text-meta rounded-lg border px-3 py-2">
              border-field-border
            </div>
            <div className="border-border text-meta rounded-lg border px-3 py-2">
              border
            </div>
          </>
        }
      />
      <BeforeAfter
        label="Focus ring: satu halo"
        before={
          <>
            <Button variant="outline" className="ring-primary/15 ring-2">
              Tombol
            </Button>
            <span className="ring-focus-ring border-primary/50 text-meta rounded-full border px-3 py-1.5 ring-2">
              Field
            </span>
          </>
        }
        after={
          <>
            <Button variant="outline" className="ring-focus-ring ring-2">
              Tombol
            </Button>
            <span className="ring-focus-ring border-primary/50 text-meta rounded-full border px-3 py-1.5 ring-2">
              Field
            </span>
          </>
        }
      />
      <BeforeAfter
        label="Hover tombol utama (token --primary-hover)"
        before={
          <>
            <span className="bg-primary text-primary-foreground text-body rounded-full px-3.5 py-1.5 font-medium">
              Diam
            </span>
            <span className="text-primary-foreground text-body rounded-full bg-[color-mix(in_oklch,var(--primary),white_12%)] px-3.5 py-1.5 font-medium">
              Hover (dicampur di kelas)
            </span>
          </>
        }
        after={
          <>
            <span className="bg-primary text-primary-foreground text-body rounded-full px-3.5 py-1.5 font-medium">
              Diam
            </span>
            <span className="bg-primary-hover text-primary-foreground text-body rounded-full px-3.5 py-1.5 font-medium">
              Hover (bg-primary-hover)
            </span>
          </>
        }
      />
      <BeforeAfter
        label='Chart: warna "blue / emerald / violet"'
        before={
          <>
            {["bg-chart-1", "bg-chart-2", "bg-chart-3"].map((c, i) => (
              <span key={c} className="flex items-center gap-2">
                <span className={cn(c, "h-3 w-10 rounded-full")} />
                <span className="text-meta">
                  {["blue", "emerald", "violet"][i]}
                </span>
              </span>
            ))}
          </>
        }
        after={
          <>
            {["bg-blue-9", "bg-green-9", "bg-purple-9"].map((c, i) => (
              <span key={c} className="flex items-center gap-2">
                <span className={cn(c, "h-3 w-10 rounded-full")} />
                <span className="text-meta">
                  {["blue", "emerald", "violet"][i]}
                </span>
              </span>
            ))}
          </>
        }
      />
      <BeforeAfter
        label="Warna hardcode → token (tahap project, diagram absen)"
        before={
          <>
            {["text-fuchsia-500", "text-orange-500", "text-emerald-500"].map(
              (c) => (
                <span key={c} className={cn(c, "text-body font-medium")}>
                  ●
                </span>
              ),
            )}
            <span className="flex h-2 w-32 overflow-hidden rounded-full">
              <span className="w-1/2 bg-[#30a46c]" />
              <span className="w-1/4 bg-[#e5a000]" />
              <span className="w-1/4 bg-[#0090ff]" />
            </span>
          </>
        }
        after={
          <>
            {["text-pink-9", "text-orange-9", "text-green-9"].map((c) => (
              <span key={c} className={cn(c, "text-body font-medium")}>
                ●
              </span>
            ))}
            <span className="flex h-2 w-32 overflow-hidden rounded-full">
              <span className="bg-success w-1/2" />
              <span className="bg-amber-10 w-1/4" />
              <span className="bg-info w-1/4" />
            </span>
          </>
        }
      />
      <Contrast />
    </div>
  )
}

const TEXT_TOKENS = [
  ["text-foreground", "Isi"],
  ["text-muted-foreground", "Sekunder"],
  ["text-tertiary-foreground", "Meta"],
  ["text-primary-ink", "Tautan / aksen"],
  ["text-destructive-ink", "Error"],
  ["text-success-ink", "Berhasil"],
  ["text-warning-ink", "Peringatan"],
  ["text-info-ink", "Info"],
  ["text-warning", "Kuning step 9 (sebelum)"],
  ["text-green-9", "Hijau step 9 (sebelum)"],
  ["text-destructive", "Merah step 9 (sebelum)"],
] as const

/** sRGB [0-255] of any CSS color, through a canvas. */
function rgb(color: string, ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const d = ctx.getImageData(0, 0, 1, 1).data
  return [d[0], d[1], d[2]] as const
}
function luminance([r, g, b]: readonly number[]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
function ratio(a: readonly number[], b: readonly number[]) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Contrast of each text token on the page background, light and dark,
 *  read from the live CSS (WCAG: 4.5 body text, 3 large text / icons). */
function Contrast() {
  const light = useRef<HTMLDivElement>(null)
  const dark = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<[number, number][]>([])
  useEffect(() => {
    const ctx = document.createElement("canvas").getContext("2d", {
      willReadFrequently: true,
    })
    if (!ctx || !light.current || !dark.current) return
    const measure = (root: HTMLDivElement) => {
      const bg = rgb(getComputedStyle(root).backgroundColor, ctx)
      return [...root.querySelectorAll<HTMLElement>("[data-probe]")].map((el) =>
        ratio(rgb(getComputedStyle(el).color, ctx), bg),
      )
    }
    const l = measure(light.current)
    const d = measure(dark.current)
    setRows(l.map((v, i) => [v, d[i]]))
  }, [])
  const cell = (v?: number) =>
    v === undefined ? (
      "…"
    ) : (
      <span
        className={cn(
          "tabular-nums",
          v >= 4.5
            ? "text-success-ink"
            : v >= 3
              ? "text-warning-ink"
              : "text-destructive",
        )}
      >
        {v.toFixed(2)}
      </span>
    )
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">
        Kontras teks di background (diukur, WCAG: 4.5 teks biasa · 3 teks besar
        / ikon)
      </h3>
      {/* Probes in each theme (hidden); the table reads them. */}
      <div aria-hidden className="sr-only">
        <div ref={light} className="bg-background">
          {TEXT_TOKENS.map(([c]) => (
            <span key={c} data-probe className={c} />
          ))}
        </div>
        <div ref={dark} className="dark bg-background">
          {TEXT_TOKENS.map(([c]) => (
            <span key={c} data-probe className={c} />
          ))}
        </div>
      </div>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          <div className="gutter-x text-tertiary-foreground text-meta grid h-9 grid-cols-[minmax(0,1fr)_5rem_5rem] items-center gap-x-4">
            <span>Token</span>
            <span className="text-right">Terang</span>
            <span className="text-right">Gelap</span>
          </div>
          {TEXT_TOKENS.map(([c, label], i) => (
            <div
              key={c}
              className="gutter-x text-body grid min-h-12 grid-cols-[minmax(0,1fr)_5rem_5rem] items-center gap-x-4 py-2"
            >
              <span className="flex min-w-0 flex-col">
                <span className={cn(c, "truncate")}>{label}</span>
                <code className="text-tertiary-foreground text-caption truncate font-mono">
                  {c}
                </code>
              </span>
              <span className="text-right">{cell(rows[i]?.[0])}</span>
              <span className="text-right">{cell(rows[i]?.[1])}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
