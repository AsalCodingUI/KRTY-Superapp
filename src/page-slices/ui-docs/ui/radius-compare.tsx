"use client"

import { ProjectAvatar } from "@/components/project-avatar"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * /ui → Radius, "Sebelum / sesudah": the old radii drawn on the left, the
 * role tokens on the right, then each token as the browser resolves it
 * (squircle included) and a nested-corner check.
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
            <div className="border-border flex flex-wrap items-end gap-3 rounded-xl border border-dashed p-5">
              {node}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const box = "bg-card border-field-border border"

function Menu({ outer, item }: { outer: string; item: string }) {
  return (
    <div
      className={cn("bg-popover flex w-44 flex-col shadow-(--elev-4)", outer)}
    >
      {["Salin tautan", "Ganti nama", "Hapus"].map((l, i) => (
        <span
          key={l}
          className={cn(
            "text-body px-2 py-1.5",
            item,
            i === 0 && "bg-(--row-hover)",
          )}
        >
          {l}
        </span>
      ))}
    </div>
  )
}

export function RadiusCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Kartu: 2xl di beberapa halaman → rounded-card"
        before={
          <>
            <div className={cn(box, "text-meta h-20 w-36 rounded-2xl p-3")}>
              Review
            </div>
            <div className={cn(box, "text-meta h-20 w-36 rounded-xl p-3")}>
              Dashboard
            </div>
          </>
        }
        after={
          <>
            <div className={cn(box, "text-meta rounded-card h-20 w-36 p-3")}>
              Review
            </div>
            <div className={cn(box, "text-meta rounded-card h-20 w-36 p-3")}>
              Dashboard
            </div>
          </>
        }
      />
      <BeforeAfter
        label="Kartu glass (login, brief, laporan): 24px → rounded-dialog"
        before={
          <div className={cn(box, "text-meta h-24 w-48 rounded-[24px] p-4")}>
            Masuk ke Kretya
          </div>
        }
        after={
          <div className={cn(box, "text-meta rounded-dialog h-24 w-48 p-4")}>
            Masuk ke Kretya
          </div>
        }
      />
      <BeforeAfter
        label="Menu: radius bersarang (sudut item sejajar sudut menu)"
        before={<Menu outer="nest-rounded-xl nest-p-1" item="rounded-lg" />}
        after={
          <Menu outer="nest-rounded-popover nest-p-2" item="rounded-nested" />
        }
      />
      <BeforeAfter
        label="Kotak project: 5px di semua ukuran → rounded-tile (¼ sisi)"
        before={
          <>
            {["size-4", "size-5", "size-7", "size-9"].map((s) => (
              <span
                key={s}
                className={cn(
                  s,
                  "bg-pink-9 flex items-center justify-center rounded-[5px] text-[9px] text-white",
                )}
              >
                K
              </span>
            ))}
          </>
        }
        after={
          <>
            {["size-4", "size-5", "size-7", "size-9"].map((s) => (
              <ProjectAvatar key={s} id="mock-kopi" name="Kopi" className={s} />
            ))}
          </>
        }
      />
      <BeforeAfter
        label="Label sidebar: rounded-xl → pill (sama kayak tombolnya)"
        before={
          <span className="bg-sidebar-accent text-caption flex h-8 items-center rounded-xl px-2.5 font-medium">
            Project
          </span>
        }
        after={
          <span className="bg-sidebar-accent text-caption rounded-control flex h-8 items-center px-2.5 font-medium">
            Project
          </span>
        }
      />
      <BeforeAfter
        label="Sheet bawah di HP: 28 / 24 / 3xl → rounded-t-dialog"
        before={
          <>
            {["rounded-t-[28px]", "rounded-t-[24px]", "rounded-t-3xl"].map(
              (c) => (
                <div key={c} className={cn(box, "h-14 w-24 border-b-0", c)} />
              ),
            )}
          </>
        }
        after={
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(box, "rounded-t-dialog h-14 w-24 border-b-0")}
              />
            ))}
          </>
        }
      />
      <Measured />
    </div>
  )
}

const ROLES = [
  ["rounded-chip", "Chip, textarea, tooltip"],
  ["rounded-row", "Highlight baris, header pill"],
  ["rounded-card", "Kartu, panel"],
  ["rounded-popover", "Popover, menu, toast"],
  ["rounded-dialog", "Dialog, sheet, kartu glass"],
  ["rounded-control", "Tombol, input, badge, tab"],
  ["rounded-tile", "Kotak project, ikon app (¼ sisi)"],
] as const

/** Each role as the browser resolves it, and a nested-corner check. */
function Measured() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLSpanElement>(null)
  const [rows, setRows] = useState<string[]>([])
  const [nest, setNest] = useState("")
  const [squircle, setSquircle] = useState<boolean | null>(null)
  useEffect(() => {
    setSquircle(CSS.supports("corner-shape", "squircle"))
    setRows(
      ROLES.map((_, i) => {
        const el = refs.current[i]
        if (!el) return ""
        const cs = getComputedStyle(el)
        const shape = cs.getPropertyValue("corner-shape") || "round"
        return `${cs.borderTopLeftRadius} · ${shape}`
      }),
    )
    if (outer.current && inner.current) {
      const o = getComputedStyle(outer.current)
      const r = parseFloat(o.borderTopLeftRadius)
      const pad = parseFloat(o.paddingTop)
      const ir = parseFloat(getComputedStyle(inner.current).borderTopLeftRadius)
      // Under squircles radii are ×1.715 (--corner-k), so the padding
      // counts ×1.715 too: inner = outer − padding × k.
      const k = CSS.supports("corner-shape", "squircle") ? 1.715 : 1
      const want = r - pad * k
      setNest(
        `menu ${r.toFixed(1)}px − padding ${pad}px × ${k} = ${want.toFixed(1)}px · item ${ir.toFixed(1)}px ${Math.abs(want - ir) < 0.5 ? "✓ sejajar" : "✕ meleset"}`,
      )
    }
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">
        Diukur dari CSS yang jalan
        {squircle !== null && (
          <span className="text-tertiary-foreground text-meta ms-2 font-normal">
            {squircle
              ? "browser ini gambar squircle (radius ×1.715)"
              : "browser ini belum dukung squircle: sudut bulat biasa"}
          </span>
        )}
      </h3>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {ROLES.map(([c, role], i) => (
            <div
              key={c}
              className="gutter-x grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 py-2"
            >
              <div
                ref={(el) => {
                  refs.current[i] = el
                }}
                className={cn(c, "bg-primary/20 size-10")}
              />
              <span className="flex min-w-0 flex-col">
                <code className="text-caption font-mono">{c}</code>
                <span className="text-tertiary-foreground text-meta truncate">
                  {role}
                </span>
              </span>
              <span className="text-muted-foreground text-meta text-right tabular-nums">
                {rows[i] || "…"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div
          ref={outer}
          className="bg-popover nest-rounded-popover nest-p-2 shadow-(--elev-4)"
        >
          <span
            ref={inner}
            className="rounded-nested text-body block bg-(--row-hover) px-3 py-1.5"
          >
            Item menu
          </span>
        </div>
        <span className="text-muted-foreground text-meta tabular-nums">
          {nest || "…"}
        </span>
      </div>
    </div>
  )
}
