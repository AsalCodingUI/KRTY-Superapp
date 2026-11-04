"use client"

import { Plus } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Shadow, "Sebelum / sesudah": old shadows / blur left, the role
 * tokens right, then each role and the layer ladder read from the page.
 */

const fab =
  "bg-popover text-foreground grid size-9 place-items-center rounded-full"

export function ShadowCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Kontrol melayang (zoom, galeri, drop): 3 level → shadow-raised"
        before={
          <>
            <span className={cn(fab, "shadow-(--elev-1)")}>
              <Plus className="size-4" />
            </span>
            <span className={cn(fab, "shadow-(--elev-2)")}>
              <Plus className="size-4" />
            </span>
            <span className={cn(fab, "shadow-(--elev-3)")}>
              <Plus className="size-4" />
            </span>
          </>
        }
        after={
          <>
            {[1, 2, 3].map((i) => (
              <span key={i} className={cn(fab, "shadow-raised")}>
                <Plus className="size-4" />
              </span>
            ))}
          </>
        }
      />
      <BeforeAfter
        label="Shadow arbitrary → token (tab bar HP, lightbox)"
        before={
          <>
            <span className="text-meta rounded-full bg-black/70 px-4 py-2 text-white shadow-[0_10px_30px_-8px_rgb(0_0_0/0.35)]">
              Tab bar
            </span>
            <span className="bg-card text-meta rounded-lg px-4 py-6 shadow-2xl">
              Gambar
            </span>
          </>
        }
        after={
          <>
            <span className="text-meta shadow-popover rounded-full bg-black/70 px-4 py-2 text-white">
              Tab bar
            </span>
            <span className="bg-card text-meta shadow-dialog rounded-lg px-4 py-6">
              Gambar
            </span>
          </>
        }
      />
      <BeforeAfter
        label="Blur di konten yang di-scroll → latar solid (lebih ringan)"
        before={
          <span className="bg-primary/30 relative h-16 w-28 rounded-lg">
            <span className="text-micro absolute right-1.5 bottom-1.5 rounded-md bg-black/55 px-1.5 py-0.5 font-medium text-white backdrop-blur-sm">
              2:14
            </span>
          </span>
        }
        after={
          <span className="bg-primary/30 relative h-16 w-28 rounded-lg">
            <span className="text-micro absolute right-1.5 bottom-1.5 rounded-md bg-black/70 px-1.5 py-0.5 font-medium text-white">
              2:14
            </span>
          </span>
        }
      />
      <Measured />
    </div>
  )
}

const ROLES = [
  ["shadow-control", "Kontrol kecil, toggle"],
  ["shadow-raised", "Kartu di chrome, kontrol melayang"],
  ["shadow-sheet", "Page sheet, kertas"],
  ["shadow-popover", "Popover, menu, toast"],
  ["shadow-dialog", "Dialog, sheet"],
] as const

const LADDER = [
  ["z-10", "sidebar"],
  ["z-20", "page"],
  ["z-30", "floating di halaman"],
  ["z-40", "top bar, tab bar HP"],
  ["z-50", "semua portal (dialog, popover, toast)"],
  ["z-editor-menu", "menu mention / slash di atas dialog"],
  ["z-lightbox", "lightbox gambar"],
  ["z-context-menu", "klik kanan"],
  ["z-over-menu", "sheet yang dibuka dari klik kanan"],
] as const

function Measured() {
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const zRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [z, setZ] = useState<string[]>([])
  useEffect(() => {
    setZ(zRefs.current.map((el) => (el ? getComputedStyle(el).zIndex : "")))
  }, [])
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-body font-medium">Shadow per peran</h3>
        <div className="bg-muted dark:bg-muted/40 flex flex-wrap gap-5 rounded-xl p-6">
          {ROLES.map(([c, role], i) => (
            <span key={c} className="flex w-36 flex-col gap-2">
              <span
                ref={(el) => {
                  refs.current[i] = el
                }}
                className={cn(c, "bg-card h-16 rounded-xl")}
              />
              <code className="text-caption font-mono">{c}</code>
              <span className="text-tertiary-foreground text-meta">{role}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-body font-medium">
          Tangga lapisan (z-index, diukur)
        </h3>
        <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
          <div className="bg-background flex flex-col rounded-lg py-1">
            {LADDER.map(([c, role], i) => (
              <div
                key={c}
                className="gutter-x grid min-h-12 grid-cols-[10rem_minmax(0,1fr)_auto] items-center gap-x-4 py-2"
              >
                <code className="text-caption font-mono">{c}</code>
                <span className="text-muted-foreground text-meta truncate">
                  {role}
                </span>
                <span className="text-tertiary-foreground text-meta tabular-nums">
                  {z[i] || "…"}
                </span>
                <span
                  aria-hidden
                  ref={(el) => {
                    zRefs.current[i] = el
                  }}
                  className={cn(c, "relative hidden")}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
