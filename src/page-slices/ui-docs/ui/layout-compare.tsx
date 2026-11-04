"use client"

import { orEmpty } from "@/components/empty-value"
import { PageHeader } from "@/components/page-header"
import {
  pageSheetClassName,
  pageSheetContentClassName,
} from "@/components/page-sheet"
import { RollingValue } from "@/components/rolling-value"
import { StatStrip } from "@/components/stat-strip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { BeforeAfter } from "./compare"

/**
 * /ui → Layout, "Sebelum / sesudah": the hand copies on the left (drawn
 * from their old markup), the shared pieces on the right, then the page
 * sheet and stat strip as the browser resolves them.
 */

const STATS = [
  { label: "Slot berikutnya", value: null },
  { label: "Terisi", value: 4 },
  { label: "Tersedia", value: 2 },
]

/** No bleed or gutter inside the compare box: the strip sits flush. */
function Flush({ children }: { children: ReactNode }) {
  return <div className="w-full [--bleed:0px]">{children}</div>
}

/** The old `StatBand` (performance/ui/list.tsx), markup as it was. */
function OldStatBand() {
  return (
    <div className="stat-strip bleed gutter-x border-border border-b py-4">
      {STATS.map((item, i) => (
        <div key={i} className="stat-tile">
          <p className="text-muted-foreground text-sm">{item.label}</p>
          <p className="text-heading text-stat font-normal tabular-nums">
            <RollingValue value={item.value}>
              {orEmpty(item.value)}
            </RollingValue>
          </p>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-2 self-center">
        <Button size="sm">Tambah slot</Button>
      </div>
    </div>
  )
}

/** The old copy in MembersAccessSettings (a Skeleton while loading). */
function OldMembersStrip() {
  return (
    <div className="stat-strip bleed gutter-x border-border border-b py-4">
      {["Total", "Designer"].map((label) => (
        <div key={label} className="stat-tile">
          <p className="text-muted-foreground text-sm">{label}</p>
          <div className="text-heading text-stat font-normal tabular-nums">
            <Skeleton className="mt-1 h-6 w-8" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Class strings as they were, one per shell. */
const OLD_SHEETS = [
  [
    "(main)/layout.tsx",
    "dark:bg-surface scroll-pane overscroll-contain [--bleed:0.75rem] [--page-gutter:…] md:z-20 md:[--page-gutter:…] xl:[--page-gutter:…] md:rounded-dialog max-md:rounded-t-dialog max-md:pt-2",
  ],
  [
    "portal/PortalShell.tsx",
    "dark:bg-surface scroll-pane max-md:rounded-t-dialog md:rounded-dialog max-md:shadow-raised overscroll-contain [--bleed:0.75rem] [--page-gutter:…] md:z-20 md:[--page-gutter:…] xl:[--page-gutter:…]",
  ],
] as const

export function LayoutCompare() {
  return (
    <div className="flex flex-col gap-8">
      <BeforeAfter
        label="Lembar halaman: dua salinan class (app + portal) → PageSheet"
        before={
          <div className="flex w-full flex-col gap-3">
            {OLD_SHEETS.map(([file, classes]) => (
              <div key={file} className="flex flex-col gap-1">
                <span className="text-meta font-medium">{file}</span>
                <code className="text-tertiary-foreground text-caption font-mono break-all">
                  {classes}
                </code>
              </div>
            ))}
          </div>
        }
        after={
          <div className="flex w-full flex-col gap-3">
            <code className="text-caption font-mono">
              {'<PageSheet mac={desktop} className="max-md:pt-2">'}
            </code>
            <code className="text-caption font-mono">
              {'<PageSheet className="max-md:shadow-raised">'}
            </code>
            <span className="text-tertiary-foreground text-meta">
              Satu sumber: components/page-sheet.tsx (bayangan, gutter, --sbw,
              radius; Mac 10px).
            </span>
          </div>
        }
      />
      <BeforeAfter
        label="StatBand (Penilaian, 1:1, KPI tim) → StatStrip orEmpty aside"
        before={
          <Flush>
            <OldStatBand />
          </Flush>
        }
        after={
          <Flush>
            <StatStrip
              orEmpty
              items={STATS}
              aside={<Button size="sm">Tambah slot</Button>}
            />
          </Flush>
        }
      />
      <BeforeAfter
        label="Anggota & akses: salinan markup → StatStrip (Skeleton jadi value)"
        before={
          <Flush>
            <OldMembersStrip />
          </Flush>
        }
        after={
          <Flush>
            <StatStrip
              items={["Total", "Designer"].map((label) => ({
                key: label,
                label,
                value: <Skeleton className="mt-1 h-6 w-8" />,
              }))}
            />
          </Flush>
        }
      />
      <BeforeAfter
        label="Sapaan dashboard: h1 text-2xl buatan sendiri → PageHeader"
        before={
          <h1 className="text-heading text-2xl font-normal tracking-tight">
            Selamat pagi, Ayu
          </h1>
        }
        after={<PageHeader title="Selamat pagi, Ayu" className="pt-0 pb-0" />}
      />
      <Measured />
    </div>
  )
}

/** The live page sheet and a StatStrip, read from the page. */
function Measured() {
  const strip = useRef<HTMLDivElement>(null)
  const [rows, setRows] = useState<[string, string][]>([])
  useEffect(() => {
    const out: [string, string][] = []
    const sheet = document.querySelector<HTMLElement>(
      '[data-slot="sidebar-inset"]',
    )
    if (sheet) {
      const cs = getComputedStyle(sheet)
      out.push(["Lembar: border-radius", cs.borderTopLeftRadius])
      out.push([
        "Lembar: --page-gutter",
        cs.getPropertyValue("--page-gutter").trim() || "…",
      ])
      out.push([
        "Lembar: semua class pageSheetClassName ada",
        pageSheetClassName.split(" ").every((c) => sheet.classList.contains(c))
          ? "ya"
          : "tidak",
      ])
      const content = sheet.querySelector<HTMLElement>(":scope > .gutter-x")
      if (content) {
        const c = getComputedStyle(content)
        out.push([
          "Isi: padding kiri / kanan / bawah",
          `${c.paddingLeft} / ${c.paddingRight} / ${c.paddingBottom}`,
        ])
      }
    }
    const el = strip.current?.firstElementChild
    if (el) {
      const cs = getComputedStyle(el)
      out.push(["StatStrip: jarak antar angka", cs.columnGap])
      out.push([
        "StatStrip: padding atas / bawah",
        `${cs.paddingTop} / ${cs.paddingBottom}`,
      ])
    }
    setRows(out)
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {rows.map(([k, v]) => (
            <div
              key={k}
              className="gutter-x grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-2"
            >
              <span className="text-caption">{k}</span>
              <span className="text-muted-foreground text-meta tabular-nums">
                {v || "…"}
              </span>
            </div>
          ))}
        </div>
      </div>
      <code className="text-tertiary-foreground text-caption font-mono">
        isi: {pageSheetContentClassName}
      </code>
      <div ref={strip} aria-hidden className="hidden">
        <StatStrip items={[]} />
      </div>
    </div>
  )
}
