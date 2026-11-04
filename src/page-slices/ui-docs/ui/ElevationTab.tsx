"use client"

import {
  GlassLayer,
  glassControlClass,
  glassSurfaceClass,
} from "@/components/minimal-screen"
import { surfaceClassName } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
  DocSwatch,
} from "./doc-blocks"

const RULES: [string, string][] = [
  [
    "Bayangan",
    "Cuma --elev-1 … --elev-5 (shadow-(--elev-N)); nggak ada shadow-lg / arbitrary",
  ],
  [
    "Level = peran",
    "1 kontrol · 2 kartu di chrome · 3 kertas / page sheet · 4 popover & menu · 5 dialog & sheet",
  ],
  ["Kartu diam", "Border (surfaceClassName), tanpa bayangan"],
  [
    "Kelompok di dalam",
    "Tint (bg-muted, --row-hover), tanpa border & bayangan",
  ],
  [
    "Di chrome",
    "Bayangan di layer sendiri + blend-shadow, biar tint-nya makin dalam",
  ],
  [
    "Kaca",
    "glassSurfaceClass + <GlassLayer /> (blur di layer GPU sendiri). Cuma layar minimal & brief",
  ],
  [
    "Blur (ringan)",
    "Hanya di permukaan kecil yang fixed; jangan di konten scroll, baris, atau overlay layar penuh",
  ],
  ["Backdrop", "bg-backdrop di belakang dialog; sheet kanan transparan"],
  [
    "z-index",
    "Ikut tangga: sidebar 10 · page 20 · topbar 40 · portal 50 · menu editor 60 · lightbox 70 · context menu 80",
  ],
]

const LEVELS: { n: 1 | 2 | 3 | 4 | 5; label: string; use: string }[] = [
  { n: 1, label: "Kontrol", use: "Thumb switch / tabs, pill kecil" },
  { n: 2, label: "Kartu di chrome", use: "Pill aktif sidebar, kartu kaca" },
  { n: 3, label: "Kertas", use: "Page sheet, invoice, halaman PDF" },
  { n: 4, label: "Popover", use: "Menu, select, toast, toolbar" },
  { n: 5, label: "Dialog", use: "Dialog, sheet, drawer, viewer" },
]

/** Spelled out so Tailwind sees each class. */
const ELEV: Record<number, string> = {
  1: "shadow-(--elev-1)",
  2: "shadow-(--elev-2)",
  3: "shadow-(--elev-3)",
  4: "shadow-(--elev-4)",
  5: "shadow-(--elev-5)",
}

const LADDER: [string, string][] = [
  ["sonner", "Toast (z-index bawaan sonner)"],
  ["9999", "Preview drag (blok dokumen, file library)"],
  ["z-[80]", "Context menu klik kanan"],
  ["z-[70]", "Image lightbox"],
  ["z-[60]", "Menu mention / slash di editor (di atas dialog)"],
  [
    "z-50",
    "Semua portal: dialog, sheet, drawer, popover, menu, select, tooltip · tab bar HP",
  ],
  ["z-40", "Top bar · toolbar editor · overlay drop file"],
  ["z-30", "Elemen melayang di halaman (AI assist, picker brief)"],
  [
    "z-20",
    "Page sheet (md) + layer bayangannya · ScreenControls · header sticky kalender",
  ],
  ["z-10", "Sidebar desktop (fixed)"],
  [
    "-z-10 … z-10",
    "Lokal di dalam komponen (GlassLayer, badge avatar, sel sticky)",
  ],
]

/** /ui → Elevation: shadow levels, glass, overlays and the z ladder. */
export function ElevationTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="elevation.md">
        Lima level bayangan, semuanya token di globals.css (--elev-1 … 5).
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Level bayangan"
        note="Tiap level: garis rambut 1px + bayangan kontak kecil + bayangan lebar yang jatuh ke bawah. Gelap: garis putih tipis."
      >
        <DocExample
          title="Di halaman"
          source="globals.css (--elev-1 … --elev-5)"
          kind="spec"
        >
          <DocCanvas className="gap-6 p-8">
            {LEVELS.map((l) => (
              <Level key={l.n} {...l} />
            ))}
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Di chrome (blend-shadow)"
          source="app/(main)/layout.tsx · components/nav-main.tsx"
          kind="spec"
        >
          <div className="bg-chrome flex flex-wrap items-center gap-6 rounded-xl p-8">
            {LEVELS.slice(0, 3).map((l) => (
              <div
                key={l.n}
                className="relative flex flex-col items-center gap-2"
              >
                <div className="relative size-24">
                  <div
                    aria-hidden
                    className={cn(
                      "blend-shadow absolute inset-0 rounded-xl",
                      ELEV[l.n],
                    )}
                  />
                  <div className="bg-background absolute inset-0 rounded-xl" />
                </div>
                <code className="font-mono text-xs">--elev-{l.n}</code>
              </div>
            ))}
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Bayangan, border, atau tint">
        <DocCanvas className="items-stretch gap-6 p-8">
          <div className={cn(surfaceClassName, "flex w-52 flex-col gap-1 p-5")}>
            <span className="text-sm font-medium">Border</span>
            <span className="text-muted-foreground text-[13px]">
              Kartu yang diam di halaman: surfaceClassName
            </span>
          </div>
          <div className="bg-muted dark:bg-muted/40 flex w-52 flex-col gap-1 rounded-xl p-5">
            <span className="text-sm font-medium">Tint</span>
            <span className="text-muted-foreground text-[13px]">
              Kelompok / status di dalam permukaan: bg-muted
            </span>
          </div>
          <div className="bg-popover flex w-52 flex-col gap-1 rounded-2xl p-5 shadow-(--elev-4)">
            <span className="text-sm font-medium">Bayangan</span>
            <span className="text-muted-foreground text-[13px]">
              Yang melayang: popover, dialog, item di-drag
            </span>
          </div>
        </DocCanvas>
      </DocGroup>

      <DocGroup
        title="Kaca"
        note="Blur di layer sendiri (translateZ(0)) supaya nggak kedip saat konten scroll. Cuma buat permukaan kecil yang diam."
      >
        <DocExample
          title="MinimalCard"
          source="components/minimal-screen.tsx (glassSurfaceClass, GlassLayer, glassControlClass)"
        >
          <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(120deg,#ffd6a5,#ffb3c7_40%,#bde0fe_75%,#f0d4ff)] p-8 dark:bg-[linear-gradient(120deg,#3b2a4d,#1f3a5f_50%,#4a2b3b)]">
            <div
              className={cn(
                glassSurfaceClass,
                "w-full max-w-xs rounded-3xl p-6",
              )}
            >
              <GlassLayer />
              <div className="flex flex-col gap-4">
                <p className="text-heading text-lg tracking-tight">Masuk</p>
                <Input
                  className={glassControlClass}
                  placeholder="nama@kretya.studio"
                />
                <Button>Lanjut</Button>
              </div>
            </div>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Backdrop">
        <div className="flex flex-wrap gap-4">
          <DocSwatch
            name="--backdrop"
            className="bg-backdrop"
            note="Di belakang dialog, alert, drawer, sheet kiri/atas/bawah"
          />
          <DocSwatch
            name="transparent"
            className="bg-transparent"
            note="Sheet kanan: halaman tetap kelihatan"
          />
          <DocSwatch
            name="bg-black/85"
            className="bg-black/85"
            note="Image lightbox (media)"
          />
        </div>
      </DocGroup>

      <DocGroup
        title="Tangga z-index"
        note="Dari atas ke bawah. Layer baru: tambah barisnya di elevation.md dulu."
      >
        <DocRules rules={LADDER} />
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            "shadow-lg, shadow-2xl, shadow-[0_10px_30px…]",
            "Kartu diam pakai border dan bayangan sekaligus",
            "backdrop-blur di header sticky, badge di baris, atau overlay layar penuh",
            'z-[999] / z-[100] "biar aman"',
            "Warna overlay baru; pakai bg-backdrop",
          ]}
        />
      </DocGroup>
    </div>
  )
}

function Level({
  n,
  label,
  use,
}: {
  n: 1 | 2 | 3 | 4 | 5
  label: string
  use: string
}) {
  return (
    <div className="flex w-32 flex-col gap-2">
      <div className={cn("bg-background h-24 rounded-xl", ELEV[n])} />
      <code className="font-mono text-xs">--elev-{n}</code>
      <span className="text-sm">{label}</span>
      <span className="text-tertiary-foreground text-[12px] leading-4">
        {use}
      </span>
    </div>
  )
}
