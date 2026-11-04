"use client"

import { HomeCard } from "@/app/(main)/dashboard/components/home-card"
import { EmptyValue } from "@/components/empty-value"
import { Markdown } from "@/components/markdown"
import { PageHeader } from "@/components/page-header"
import { Panel } from "@/components/panel"
import { SectionTitle } from "@/components/section-title"
import { StatStrip } from "@/components/stat-strip"
import { Badge } from "@/components/ui/badge"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, type ReactNode } from "react"
import * as mock from "../model/typography-mock"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
  DocToken,
} from "./doc-blocks"

const RULES: [string, ReactNode][] = [
  [
    "Font",
    "Geist + Geist Mono (next/font, di layout.tsx). Jangan tambah font lain",
  ],
  [
    "Token per peran",
    "Satu kelas = ukuran + leading + tracking: text-micro · caption · meta · body · title · section · stat · page-title · kpi (globals.css @theme). Berat tetap terpisah",
  ],
  [
    "Ukuran",
    "Cuma 11 · 12 · 13 · 14 · 15 · 18 · 20 · 24 · 28 (+ 36/48 judul dokumen). Nggak ada text-[Npx]",
  ],
  [
    "Tracking",
    "Bertingkat, udah di token: 11px +0.01em · 12px +0.005em · 13–14px 0 · 15px −0.005em · 18px −0.01em · 20–24px −0.02em · 28px −0.025em. Jangan tambah tracking-*",
  ],
  [
    "Leading",
    "Udah di token (13/18, 15/22, 18/26…). Pengecualian: leading-none (angka bertumpuk), leading-7 (prosa)",
  ],
  [
    "Berat",
    "Cuma font-normal (450) dan font-medium (500). Nggak ada semibold/bold/light",
  ],
  [
    "Warna",
    "Judul text-heading · isi foreground · sekunder muted · meta tertiary. Abu-abu lain nggak ada",
  ],
  ["Angka", "Selalu tabular-nums; kosong pakai EmptyValue, bukan “-”"],
  [
    "Teks panjang",
    "min-w-0 + truncate di baris, line-clamp-2 buat cuplikan, text-balance buat judul yang bisa turun baris",
  ],
  [
    "Bahasa",
    "Teks Indonesia ~30% lebih panjang: jangan kunci lebar, cek di HP, jangan uppercase. Angka & uang ikut bahasa aktif",
  ],
]

/** Each role, its token and what it comes to. */
const SCALE: {
  role: string
  classes: string
  px: string
  sample: ReactNode
}[] = [
  {
    role: "Judul dokumen",
    classes: "text-heading text-4xl leading-tight font-medium tracking-tight",
    px: "36 / 45 · medium · Markdown #",
    sample: "Aturan kerja",
  },
  {
    role: "Angka KPI",
    classes: "text-heading text-kpi leading-none font-normal tabular-nums",
    px: "28 / 34 · −0.025em · HomeFigure, KPI",
    sample: "92,4",
  },
  {
    role: "Judul halaman",
    classes: "text-heading text-page-title font-normal",
    px: "24 / 30 · −0.02em · PageHeader",
    sample: "Cuti & Kehadiran",
  },
  {
    role: "Nilai statistik",
    classes: "text-heading text-stat font-normal tabular-nums",
    px: "20 / 26 · −0.02em · StatStrip, StatTiles",
    sample: "Rp 12.450.000",
  },
  {
    role: "Judul seksi / editor",
    classes: "text-heading text-section font-medium",
    px: "18 / 26 · −0.01em · dialog editor, empty state",
    sample: "Invoice INV-2026-031",
  },
  {
    role: "Judul dialog / kartu",
    classes: "text-heading text-title font-medium",
    px: "15 / 22 · −0.005em · DialogTitle, SheetTitle, CardTitle, HomeCard",
    sample: "Ajukan cuti",
  },
  {
    role: "Isi (body)",
    classes: "text-body",
    px: "14 / 20 · = text-sm",
    sample: "Rebranding PT Nusantara Kreatif",
  },
  {
    role: "Sekunder / deskripsi",
    classes: "text-muted-foreground text-body",
    px: "14 / 20 · DialogDescription",
    sample: "Pilih tanggal dan jenis cuti.",
  },
  {
    role: "Meta / label kolom",
    classes: "text-tertiary-foreground text-meta",
    px: "13 / 18 · di bawah judul baris, ListHeader, ListChip",
    sample: "12–14 Nov · 3 hari",
  },
  {
    role: "Kecil",
    classes: "text-caption",
    px: "12 / 16 · +0.005em · badge, tooltip",
    sample: "Diperbarui 5 menit lalu",
  },
  {
    role: "Mikro",
    classes: "text-micro font-medium tabular-nums",
    px: "11 / 16 · +0.01em · pill, kbd, penghitung",
    sample: "24",
  },
  {
    role: "Kode",
    classes: "font-mono text-caption",
    px: "12 / 16 · Geist Mono",
    sample: "docs/ui/typography.md",
  },
]

const COLORS: [string, string, string][] = [
  ["text-heading", "Judul", "Judul halaman, kartu, dialog"],
  ["text-foreground", "Isi", "Teks biasa dan nilai"],
  ["text-muted-foreground", "Sekunder", "Deskripsi, ikon di baris"],
  ["text-tertiary-foreground", "Meta", "Jumlah, tanggal kecil, petunjuk"],
  ["text-primary underline", "Tautan", "Garis bawah titik-titik (global)"],
  ["text-destructive", "Error", "Pesan error, aksi hapus"],
  ["text-success-ink", "Berhasil", "Teks & ikon hijau"],
  ["text-amber-11", "Peringatan", "Teks kuning (ikon: text-warning)"],
]

const DONTS: ReactNode[] = [
  <>
    <code className="font-mono text-xs">text-[12px]</code>,{" "}
    <code className="font-mono text-xs">text-[14px]</code>,{" "}
    <code className="font-mono text-xs">text-[13.5px]</code>: pakai langkah
    skala (text-xs, text-sm)
  </>,
  <>
    <code className="font-mono text-xs">text-base</code> /{" "}
    <code className="font-mono text-xs">text-xl</code> di judul dialog atau
    kartu (harusnya 15px)
  </>,
  "font-semibold, font-bold, font-light",
  "tracking-tight di teks kecil, tracking-wide uppercase buat label",
  <>
    <code className="font-mono text-xs">text-muted-foreground/60</code> buat
    abu-abu yang lebih pudar (pakai tertiary)
  </>,
  "text-warning buat kalimat (kuning step 9 susah dibaca di putih); pakai text-amber-11",
  "Angka di kolom atau statistik tanpa tabular-nums",
  "Nyalin markup SectionTitle / StatStrip ke halaman; impor komponennya",
]

/**
 * /ui → Typography: the type scale by role, text colors, numbers and long
 * text, the shared components that own each role, and what to avoid.
 */
export function TypographyTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="typography.md">
        Satu skala huruf buat semua halaman: pilih perannya, pakai kelasnya.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Sebelum / sesudah"
        note="Yang berubah di app: tracking bertingkat, leading 13px tetap, satu ukuran KPI, judul dialog seragam."
      >
        <BeforeAfter
          label="Tracking judul 18 / 24 / 28px"
          before={
            <div className="flex flex-col gap-1">
              <span className="text-lg tracking-tight">Invoice bulan ini</span>
              <span className="text-2xl tracking-tight">Cuti & Kehadiran</span>
              <span className="text-[1.75rem] leading-none tracking-tight tabular-nums">
                92,4
              </span>
            </div>
          }
          after={
            <div className="flex flex-col gap-1">
              <span className="text-section">Invoice bulan ini</span>
              <span className="text-page-title">Cuti & Kehadiran</span>
              <span className="text-kpi leading-none tabular-nums">92,4</span>
            </div>
          }
        />
        <BeforeAfter
          label="Meta 13px dua baris (dulu ikut parent: 18.6 / 20px)"
          before={
            <p className="text-muted-foreground max-w-56 text-[13px]">
              Rebranding PT Nusantara Kreatif · 12–14 Nov · 3 hari kerja
            </p>
          }
          after={
            <p className="text-muted-foreground text-meta max-w-56">
              Rebranding PT Nusantara Kreatif · 12–14 Nov · 3 hari kerja
            </p>
          }
        />
        <BeforeAfter
          label="Angka KPI (dulu 28 / 32 / 30px)"
          before={
            <div className="flex items-end gap-4 tabular-nums">
              <span className="text-[1.75rem] leading-none tracking-tight">
                87
              </span>
              <span className="text-[2rem] leading-none tracking-tight">
                92
              </span>
              <span className="text-3xl leading-tight font-medium tracking-tight">
                4,8
              </span>
            </div>
          }
          after={
            <div className="flex items-end gap-4 tabular-nums">
              <span className="text-kpi leading-none">87</span>
              <span className="text-kpi leading-none">92</span>
              <span className="text-kpi leading-none font-medium">4,8</span>
            </div>
          }
        />
        <BeforeAfter
          label="Judul dialog (dulu 15 / 16 / 18 / 20px)"
          before={
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-medium">Ajukan cuti</span>
              <span className="text-base font-medium">Rapat mingguan</span>
              <span className="text-lg font-medium">Laporan klien</span>
              <span className="text-xl tracking-tight">Edit invoice</span>
            </div>
          }
          after={
            <div className="flex flex-col gap-1">
              <span className="text-title font-medium">Ajukan cuti</span>
              <span className="text-title font-medium">Rapat mingguan</span>
              <span className="text-section font-medium">Laporan klien</span>
              <span className="text-section">Edit invoice</span>
            </div>
          }
        />
        <MeasuredTokens />
      </DocGroup>

      <DocGroup
        title="Skala per peran"
        note="Ukuran / tinggi baris dalam px. Kelasnya persis yang dipakai di aplikasi."
      >
        <div className="flex flex-col">
          {SCALE.map((s) => (
            <DocToken
              key={s.role}
              name={s.classes}
              value={`${s.role} · ${s.px}`}
            >
              <p className={cn("min-w-0 truncate", s.classes)}>{s.sample}</p>
            </DocToken>
          ))}
        </div>
      </DocGroup>

      <DocGroup
        title="Warna teks"
        note="Abu-abu cuma dua: muted dan tertiary. Detail token di tab Color."
      >
        <div className="flex flex-col">
          {COLORS.map(([cls, label, use]) => (
            <DocToken key={cls} name={cls} value={use}>
              <span className={cls}>{label}: Pengajuan cuti tahunan</span>
            </DocToken>
          ))}
        </div>
      </DocGroup>

      <DocGroup title="Angka">
        <DocExample
          title="tabular-nums: digit sama lebar, kolom rata"
          kind="spec"
        >
          <DocCanvas className="items-start gap-10">
            <NumberColumn label="Tanpa" amounts={mock.amounts} />
            <NumberColumn label="tabular-nums" amounts={mock.amounts} tabular />
          </DocCanvas>
        </DocExample>
        <DocExample title="Nilai kosong" source="components/empty-value.tsx">
          <DocCanvas className="gap-8">
            <span className="text-sm tabular-nums">
              Total: <EmptyValue />
            </span>
            <span className="text-xl font-normal tracking-tight tabular-nums">
              <EmptyValue />
            </span>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Teks panjang">
        <DocExample title="Di baris: min-w-0 + truncate" kind="spec">
          <DocCanvas>
            <div className="flex w-full max-w-sm min-w-0 flex-col">
              <span className="truncate text-sm">{mock.longTitle}</span>
              <span className="text-tertiary-foreground truncate text-[13px]">
                {mock.longText}
              </span>
            </div>
          </DocCanvas>
        </DocExample>
        <DocExample title="Cuplikan: line-clamp-2" kind="spec">
          <DocCanvas>
            <p className="text-muted-foreground line-clamp-2 max-w-sm text-sm">
              {mock.longText}
            </p>
          </DocCanvas>
        </DocExample>
        <DocExample title="Judul yang turun baris: text-balance" kind="spec">
          <DocCanvas className="items-start gap-8">
            <div className="flex max-w-xs flex-col gap-1">
              <span className="text-tertiary-foreground text-xs">Tanpa</span>
              <p className="text-heading text-2xl font-medium tracking-tight">
                {mock.longTitle}
              </p>
            </div>
            <div className="flex max-w-xs flex-col gap-1">
              <span className="text-tertiary-foreground text-xs">
                text-balance
              </span>
              <p className="text-heading text-2xl font-medium tracking-tight text-balance">
                {mock.longTitle}
              </p>
            </div>
          </DocCanvas>
        </DocExample>
        <DocExample title="Bahasa Indonesia lebih panjang" kind="spec">
          <DocCanvas className="flex-col items-start gap-2">
            {mock.i18nPairs.map(([en, id]) => (
              <div key={en} className="flex items-center gap-3 text-sm">
                <span className="text-tertiary-foreground w-36 text-[13px]">
                  {en}
                </span>
                <span>{id}</span>
                <span className="text-tertiary-foreground text-xs tabular-nums">
                  +{Math.round((id.length / en.length - 1) * 100)}%
                </span>
              </div>
            ))}
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Komponen yang punya perannya"
        note="Pakai komponennya, jangan nyalin kelasnya ke halaman."
      >
        <DocExample title="Judul halaman" source="components/page-header.tsx">
          <PageHeader title="Cuti & Kehadiran" />
        </DocExample>
        <DocExample title="Statistik" source="components/stat-strip.tsx">
          <StatStrip items={mock.stats} />
        </DocExample>
        <DocExample title="Judul seksi" source="components/section-title.tsx">
          <SectionTitle extra={3}>Pengajuan terbaru</SectionTitle>
        </DocExample>
        <DocExample
          title="Kartu dan panel"
          source="dashboard/components/home-card.tsx · components/panel.tsx"
          className="grid gap-4 md:grid-cols-2"
        >
          <HomeCard title="Langganan">
            <p className="text-muted-foreground text-sm">
              3 langganan aktif bulan ini.
            </p>
          </HomeCard>
          <Panel title="Tugas minggu ini" meta={5}>
            <p className="text-muted-foreground px-4 py-3 text-sm">
              Judul panel lebih padat: 14px medium.
            </p>
          </Panel>
        </DocExample>
        <DocExample
          title="Kecil: badge, kbd"
          source="components/ui/badge.tsx · components/ui/kbd.tsx"
        >
          <DocCanvas>
            <Badge variant="success">Disetujui</Badge>
            <Badge variant="warning">Menunggu</Badge>
            <Kbd>⌘K</Kbd>
            <span className="bg-primary/10 text-primary rounded-full px-1.5 py-px text-[11px] leading-4 font-medium tabular-nums">
              12
            </span>
          </DocCanvas>
        </DocExample>
        <DocExample title="Prosa" source="components/markdown.tsx">
          <div className="max-w-2xl">
            <Markdown>{mock.markdown}</Markdown>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont items={DONTS} />
      </DocGroup>
    </div>
  )
}

function NumberColumn({
  label,
  amounts,
  tabular,
}: {
  label: string
  amounts: string[]
  tabular?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-tertiary-foreground text-xs">{label}</span>
      {amounts.map((a) => (
        <span
          key={a}
          className={cn("text-right text-sm", tabular && "tabular-nums")}
        >
          {a}
        </span>
      ))}
    </div>
  )
}

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
        {[
          ["Sebelum", before],
          ["Sesudah", after],
        ].map(([title, node]) => (
          <div key={title as string} className="flex flex-col gap-2">
            <span className="text-tertiary-foreground text-meta">{title}</span>
            <div className="border-border rounded-xl border border-dashed p-5">
              {node}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TOKENS = [
  "text-micro",
  "text-caption",
  "text-meta",
  "text-body",
  "text-title",
  "text-section",
  "text-stat",
  "text-page-title",
  "text-kpi",
] as const

/** Each token as the browser resolves it, read from the live CSS. */
function MeasuredTokens() {
  const [rows, setRows] = useState<[string, string, string, string][]>([])
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  useEffect(() => {
    setRows(
      TOKENS.map((t, i) => {
        const cs = refs.current[i] && getComputedStyle(refs.current[i]!)
        return [
          t,
          cs?.fontSize ?? "",
          cs?.lineHeight ?? "",
          cs?.letterSpacing ?? "",
        ]
      }),
    )
  }, [])
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-body font-medium">Diukur dari CSS yang jalan</h3>
      <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
        <div className="bg-background flex flex-col rounded-lg py-1">
          {TOKENS.map((t, i) => (
            <div
              key={t}
              className="gutter-x grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-2 sm:grid-cols-[10rem_minmax(0,1fr)_14rem]"
            >
              <code className="text-caption font-mono">{t}</code>
              <span
                ref={(el) => {
                  refs.current[i] = el
                }}
                className={cn(t, "hidden truncate sm:block")}
              >
                Kretya Studio 2026
              </span>
              <span className="text-tertiary-foreground text-meta text-right tabular-nums">
                {rows[i]
                  ? `${rows[i][1]} / ${rows[i][2]} · ${rows[i][3]}`
                  : "…"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
