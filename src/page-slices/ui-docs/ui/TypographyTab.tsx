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
import type { ReactNode } from "react"
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
    "Ukuran",
    "Cuma 11 · 12 · 13 · 14 · 15 · 18 · 20 · 24 (+ 36/48 buat judul dokumen & angka besar). Nggak ada text-[12px], text-[13.5px]",
  ],
  ["Teks biasa", "text-sm (14/20), sudah default di body"],
  [
    "Berat",
    "Cuma font-normal (450) dan font-medium (500). Nggak ada semibold/bold/light",
  ],
  [
    "Tracking",
    "tracking-tight cuma di 18px ke atas (judul, angka). Nggak di text-sm",
  ],
  [
    "Leading",
    "Ikut ukurannya. Pengecualian: leading-none (angka besar), leading-snug (judul dialog), leading-7 (prosa)",
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
    "Teks Indonesia ~30% lebih panjang: jangan kunci lebar, cek di HP, jangan uppercase",
  ],
]

/** Each role, the classes it uses and what they come to. */
const SCALE: {
  role: string
  classes: string
  px: string
  sample: ReactNode
}[] = [
  {
    role: "Judul dokumen",
    classes: "text-heading text-4xl leading-tight font-medium tracking-tight",
    px: "36 / 45 · medium",
    sample: "Aturan kerja",
  },
  {
    role: "Angka besar (KPI)",
    classes:
      "text-heading text-5xl leading-none font-normal tracking-tight tabular-nums",
    px: "48 / 48 · normal",
    sample: "92",
  },
  {
    role: "Judul halaman",
    classes: "text-heading text-2xl font-normal tracking-tight",
    px: "24 / 32 · normal · PageHeader",
    sample: "Cuti & Kehadiran",
  },
  {
    role: "Nilai statistik",
    classes: "text-xl font-normal tracking-tight tabular-nums",
    px: "20 / 28 · normal · StatStrip",
    sample: "Rp 12.450.000",
  },
  {
    role: "Judul di dokumen",
    classes: "text-heading text-xl font-medium tracking-tight",
    px: "20 / 28 · medium · Markdown #",
    sample: "Peralatan kerja",
  },
  {
    role: "Judul empty state",
    classes: "text-lg font-medium tracking-tight",
    px: "18 / 28 · medium",
    sample: "Belum ada pengajuan",
  },
  {
    role: "Judul dialog / sheet",
    classes: "text-heading text-[15px] leading-snug font-medium",
    px: "15 / 20.6 · medium · DialogTitle",
    sample: "Ajukan cuti",
  },
  {
    role: "Judul kartu",
    classes: "text-heading text-[15px] font-normal",
    px: "15 / 21.4 · normal · HomeCard",
    sample: "Langganan",
  },
  {
    role: "Prosa",
    classes: "text-foreground/90 text-[15px] leading-7",
    px: "15 / 28 · Markdown, editor",
    sample: "Karyawan boleh bekerja dari mana saja selama jam inti.",
  },
  {
    role: "Judul panel / seksi",
    classes: "text-heading text-sm font-medium",
    px: "14 / 20 · medium · Panel",
    sample: "Tugas minggu ini",
  },
  {
    role: "Isi (body)",
    classes: "text-sm",
    px: "14 / 20 · normal (450)",
    sample: "Rebranding PT Nusantara Kreatif",
  },
  {
    role: "Sekunder / deskripsi",
    classes: "text-muted-foreground text-sm",
    px: "14 / 20 · DialogDescription",
    sample: "Pilih tanggal dan jenis cuti.",
  },
  {
    role: "Meta / keterangan",
    classes: "text-tertiary-foreground text-[13px]",
    px: "13 / ~18.6 · di bawah judul baris",
    sample: "12–14 Nov · 3 hari",
  },
  {
    role: "Label kolom",
    classes: "text-muted-foreground text-[13px]",
    px: "13 / ~18.6 · ListHeader",
    sample: "Nama · Status · Total",
  },
  {
    role: "Kecil",
    classes: "text-xs",
    px: "12 / 16 · badge, tooltip, kbd",
    sample: "Diperbarui 5 menit lalu",
  },
  {
    role: "Penghitung",
    classes: "text-[11px] leading-4 font-medium tabular-nums",
    px: "11 / 16 · angka di pill, inisial",
    sample: "24",
  },
  {
    role: "Kode",
    classes: "font-mono text-xs",
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
