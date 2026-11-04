"use client"

import { SpacingCompare } from "./spacing-compare"
import { HomeCard, HomeRow } from "@/app/(main)/dashboard/components/home-card"
import { GroupedList, ListRow } from "@/components/grouped-list"
import { PageHeader } from "@/components/page-header"
import { Panel, PanelList } from "@/components/panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { RiAddLine, RiDownloadLine } from "@/shared/ui/lucide-icons"
import type { CSSProperties, ReactNode } from "react"
import * as mock from "../model/spacing-mock"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
  DocToken,
} from "./doc-blocks"

const RULES: [string, string][] = [
  ["Grid", "Kelipatan 4px; di halaman pakai langkah utuh (1, 2, 3, 4, 6, 8)"],
  [
    "Gutter",
    "Sisi halaman cuma dari gutter-x (--page-gutter): HP 20px · md 40px · xl 64px",
  ],
  [
    "Bleed",
    "Daftar & tabel keluar --bleed (12px) lewat bleed; teks barisnya tetap sejajar judul",
  ],
  ["Judul halaman", "PageHeader pt-6 pb-4; antar blok 16px (mb-4 / gap-4)"],
  [
    "Bawah halaman",
    "Nggak usah padding: layout sudah kasih md:pb-6 + ruang tab bar HP",
  ],
  ["Kartu / dialog / sheet", "Padding 20px: p-5 · pane-px-5"],
  [
    "Scroll pane",
    "scroll-pane pane-px-5, bukan overflow-y-auto px-5 (kiri = kanan walau ada scrollbar)",
  ],
  [
    "Jarak isi",
    "Ikon ↔ teks tombol sudah built-in · antar tombol gap-2 · ikon baris ↔ teks gap-3 · kolom gap-x-4",
  ],
  ["Form", "Label → input gap-2 · antar field gap-4 · grup gap-6"],
  ["Antar elemen", "gap-* di parent; jangan space-y-* atau margin per anak"],
]

const SCALE: { step: string; px: number; use: string }[] = [
  { step: "0.5", px: 2, use: "Tumpukan judul + deskripsi" },
  { step: "1", px: 4, use: "Antar baris daftar, ikon di header kartu" },
  { step: "1.5", px: 6, use: "Ikon ↔ teks di tombol & chip" },
  { step: "2", px: 8, use: "Default: antar tombol, label → input" },
  { step: "3", px: 12, use: "Ikon / avatar ↔ teks di baris" },
  { step: "4", px: 16, use: "Antar field, antar blok, gap-x kolom" },
  { step: "5", px: 20, use: "Padding kartu, dialog, sheet" },
  { step: "6", px: 24, use: "Atas halaman (pt-6), grup field" },
  { step: "8", px: 32, use: "Antar bagian besar" },
  { step: "10", px: 40, use: "stat-strip, gutter desktop" },
]

const SECTIONS: { label: string; cls: string; px: number }[] = [
  { label: "PageHeader pt-6", cls: "pt-6", px: 24 },
  { label: "Judul", cls: "", px: 0 },
  { label: "PageHeader pb-4", cls: "pb-4", px: 16 },
  { label: "TabNavigation", cls: "", px: 0 },
  { label: "mb-4", cls: "mb-4", px: 16 },
  { label: "Toolbar / cari", cls: "", px: 0 },
  { label: "mb-4", cls: "mb-4", px: 16 },
  { label: "Isi (daftar, kartu)", cls: "", px: 0 },
]

/** /ui → Spacing: the grid, gutter and bleed, page and card spacing. */
export function SpacingTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="spacing.md">
        Jarak pakai grid 4px; gutter dan bleed diatur sekali di layout halaman.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Sebelum / sesudah"
        note="Kiri: nilai lama; kanan: token per peran yang sekarang jalan di app."
      >
        <SpacingCompare />
      </DocGroup>

      <DocGroup
        title="Skala"
        note="--spacing = 4px. Setengah langkah (2.5, 3.5) cuma di dalam komponen bersama."
      >
        <div className="flex flex-col">
          {SCALE.map((s) => (
            <DocToken
              key={s.step}
              name={`gap-${s.step} · p-${s.step}`}
              value={`${s.px}px`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="bg-primary/60 h-4 shrink-0 rounded-[2px]"
                  style={{ width: s.px * 2 }}
                />
                <span className="text-muted-foreground text-sm">{s.use}</span>
              </div>
            </DocToken>
          ))}
        </div>
      </DocGroup>

      <DocGroup
        title="Gutter & bleed"
        note="Biru = gutter (--page-gutter). Baris daftar keluar 12px (--bleed), teksnya tetap sejajar judul."
      >
        <DocExample
          title="Halaman md (gutter 40px)"
          source="src/app/(main)/layout.tsx · globals.css (gutter-x, bleed) · components/grouped-list.tsx"
          kind="spec"
        >
          <GutterFrame gutter="2.5rem">
            <h3 className="text-heading pb-4 text-xl tracking-tight">
              Judul halaman
            </h3>
            <GroupedList>
              {mock.gutterRows.map((r) => (
                <ListRow key={r.name} desc>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{r.name}</span>
                    <span className="text-tertiary-foreground truncate text-[13px]">
                      {r.client}
                    </span>
                  </div>
                  <Badge variant="secondary">{r.status}</Badge>
                </ListRow>
              ))}
            </GroupedList>
          </GutterFrame>
        </DocExample>
        <DocExample title="HP (gutter 20px)" kind="spec">
          <div className="max-w-sm">
            <GutterFrame gutter="1.25rem">
              <h3 className="text-heading pb-4 text-xl tracking-tight">
                Judul
              </h3>
              <GroupedList>
                {mock.gutterRows.slice(0, 2).map((r) => (
                  <ListRow key={r.name}>
                    <span className="truncate">{r.name}</span>
                  </ListRow>
                ))}
              </GroupedList>
            </GutterFrame>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Jarak antar bagian halaman">
        <div className="grid gap-8 lg:grid-cols-2">
          <DocExample title="Urutan dari atas" kind="spec">
            <div className="border-border flex flex-col rounded-xl border border-dashed px-5 pb-5">
              {SECTIONS.map((s, i) =>
                s.px ? (
                  <div
                    key={i}
                    className="bg-info/10 text-info flex items-center justify-end px-2 text-[11px] tabular-nums"
                    style={{ height: s.px }}
                  >
                    {s.label} · {s.px}px
                  </div>
                ) : (
                  <div
                    key={i}
                    className="bg-muted text-muted-foreground flex h-9 items-center rounded-lg px-3 text-[13px]"
                  >
                    {s.label}
                  </div>
                ),
              )}
            </div>
          </DocExample>
          <DocExample
            title="PageHeader"
            source="components/page-header.tsx (className pt-6 pb-4)"
          >
            <div className="border-border rounded-xl border border-dashed px-5">
              <PageHeader
                title="Klien"
                actions={
                  <>
                    <Button variant="outline">
                      <RiDownloadLine data-icon="inline-start" />
                      Ekspor
                    </Button>
                    <Button>
                      <RiAddLine data-icon="inline-start" />
                      Klien baru
                    </Button>
                  </>
                }
              />
            </div>
          </DocExample>
        </div>
      </DocGroup>

      <DocGroup title="Kartu, dialog, sheet" note="Semua 20px dari tepi.">
        <div className="grid gap-8 md:grid-cols-2">
          <DocExample
            title="HomeCard (p-5 · gap-4)"
            source="app/(main)/dashboard/components/home-card.tsx"
          >
            <HomeCard title="Langganan">
              <div className="flex flex-col">
                {mock.cardRows.map((r) => (
                  <HomeRow
                    key={r.title}
                    title={r.title}
                    subtitle={r.subtitle}
                    trailing={<span>{r.trailing}</span>}
                  />
                ))}
              </div>
            </HomeCard>
          </DocExample>
          <DocExample
            title="Panel (header h-11 px-4)"
            source="components/panel.tsx"
          >
            <Panel title="Tagihan" meta={mock.cardRows.length}>
              <PanelList>
                {mock.cardRows.map((r) => (
                  <ListRow key={r.title}>
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    <span className="tabular-nums">{r.trailing}</span>
                  </ListRow>
                ))}
              </PanelList>
            </Panel>
          </DocExample>
        </div>
        <DocRules
          rules={[
            [
              "Dialog",
              "Header px-5 pt-5 pr-12 · body pane-px-5 pt-4 pb-1 gap-4 · footer px-5 pb-5 pt-4 gap-2",
            ],
            [
              "Sheet kanan",
              "Header min-h-[3.25rem] px-5 pr-14 · body scroll-pane pane-px-5 · footer px-5 py-3 gap-2",
            ],
            ["Popover", "p-4 gap-4 · menu nest-p-2"],
            [
              "Di dalam kartu",
              "Set ulang [--bleed:…] [--page-gutter:…] ke padding kotaknya",
            ],
          ]}
        />
      </DocGroup>

      <DocGroup
        title="Scroll pane"
        note="Scrollbar desktop makan 12px di satu sisi. scroll-pane nyimpen ruangnya di dua sisi, pane-px-5 ngurangin dari padding (--sbw)."
      >
        <div className="grid gap-8 md:grid-cols-2">
          <DocExample
            title="Benar: scroll-pane pane-px-5"
            source="globals.css"
            kind="spec"
          >
            <PaneDemo className="scroll-pane pane-px-5" />
          </DocExample>
          <DocExample title="Salah: overflow-y-auto px-5" kind="spec">
            <PaneDemo className="overflow-y-auto px-5" />
          </DocExample>
        </div>
      </DocGroup>

      <DocGroup title="Jarak di dalam kontrol & form">
        <div className="grid gap-8 md:grid-cols-2">
          <DocExample
            title="Tombol berdampingan (gap-2)"
            source="components/ui/button.tsx"
          >
            <DocCanvas className="gap-2">
              <Button variant="outline">Batal</Button>
              <Button>Simpan</Button>
            </DocCanvas>
          </DocExample>
          <DocExample
            title="Field (label → input gap-2, antar field gap-4)"
            kind="spec"
          >
            <DocCanvas className="flex-col items-stretch gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sp-name">Nama</Label>
                <Input id="sp-name" placeholder="Kretya Studio" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sp-mail">Email</Label>
                <Input id="sp-mail" placeholder="halo@kretya.studio" />
              </div>
            </DocCanvas>
          </DocExample>
        </div>
      </DocGroup>

      <DocGroup title="Sentuh, responsif, safe area">
        <DocRules
          rules={[
            ["Baris", "min-h-12 (48px), dengan deskripsi min-h-14"],
            ["Kontrol", "h-8 (32px); aksi utama di HP size lg (40px)"],
            ["Ikon di baris", "icon-sm (28px), di HP max-md:size-8"],
            ["Tab bar HP", "Tab h-11 (44px), tombol size-14"],
            [
              "Aksi hover",
              "Di layar sentuh tetap kelihatan: pointer-coarse:opacity-100",
            ],
            [
              "Breakpoint",
              "md = batas HP/desktop · sm = dialog jadi sheet bawah · lg = side panel · xl = gutter lebar",
            ],
            [
              "Safe area",
              "Cuma di layout, tab bar, dan dialog-sheet HP (env(safe-area-inset-bottom))",
            ],
          ]}
        />
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            "px-4 md:px-8 di blok halaman (pakai gutter)",
            "-mx-4 / -mx-5 buat keluar dari container (pakai bleed)",
            "space-y-4, mt-4 di tiap anak, gap-2.5 / gap-7 di halaman",
            "p-[3px], py-[4px] dan angka px lain",
            "overflow-y-auto px-5 di body sheet",
            "pb-16 / pb-6 di bawah halaman",
          ]}
        />
      </DocGroup>
    </div>
  )
}

/** A page-like frame: its gutter drawn in blue, content inside gutter-x. */
function GutterFrame({
  gutter,
  children,
}: {
  gutter: string
  children: ReactNode
}) {
  return (
    <div
      className="border-border relative overflow-hidden rounded-xl border border-dashed py-5"
      style={{ "--page-gutter": gutter, "--bleed": "0.75rem" } as CSSProperties}
    >
      <div className="bg-info/10 pointer-events-none absolute inset-y-0 left-0 w-(--page-gutter)" />
      <div className="bg-info/10 pointer-events-none absolute inset-y-0 right-0 w-(--page-gutter)" />
      <div className="gutter-x relative">{children}</div>
    </div>
  )
}

function PaneDemo({ className }: { className: string }) {
  return (
    <div className="border-border bg-background h-48 rounded-xl border">
      <div className={cn("h-full py-3", className)}>
        <div className="flex flex-col gap-2">
          {mock.paneLines.map((line) => (
            <div
              key={line}
              className="bg-muted rounded-md px-2 py-1 text-[13px]"
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
