"use client"

import { CalloutBox } from "@/components/callout-box"
import { surfaceClassName } from "@/components/panel"
import { ProjectAvatar, projectColorVar } from "@/components/project-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { chartColors } from "@/shared/lib/chart/utils"
import type { ReactNode } from "react"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
  DocSwatch,
} from "./doc-blocks"

const RULES: [string, ReactNode][] = [
  [
    "Urutan pilih",
    "1) varian komponen (Badge, Button) · 2) token semantik · 3) palet step 9/3/11 kalau warnanya memang data",
  ],
  [
    "Dilarang",
    "Warna bawaan Tailwind (text-gray-500, bg-red-500), hex/rgb/oklch di kelas atau style",
  ],
  [
    "Teks abu-abu",
    "Cuma text-muted-foreground dan text-tertiary-foreground. Bukan /50, /60",
  ],
  [
    "Teks berwarna",
    "Step 11 atau token -ink (text-amber-11, text-success-ink). Step 9 buat ikon, titik, isian",
  ],
  [
    "Opacity",
    "Boleh buat tint warna solid (bg-primary/10) dan ring fokus. Jangan buat abu-abu, garis, atau bg-muted/50",
  ],
  [
    "Garis",
    "Hairline: border (warnanya otomatis). Field & tombol outline: border-field-border",
  ],
  ["Fokus", "focus-visible:border-primary/50 + ring-2 ring-focus-ring"],
  [
    "Gelap",
    "Token ganti sendiri. dark: cuma buat keputusan khusus gelap. Cek juga sidebar gelap di mode terang",
  ],
  [
    "Tint",
    "Warna tema user (--tint-h, --tint-c) sudah masuk ke token. Jangan baca sendiri",
  ],
]

type Token = [name: string, note: string]

const GROUPS: { title: string; note?: string; tokens: Token[] }[] = [
  {
    title: "Permukaan",
    tokens: [
      ["background", "Halaman"],
      ["card", "Kartu (= halaman di terang)"],
      ["popover", "Menu, popover, dialog"],
      ["surface", "Gelap: panel utama halaman"],
      ["muted", "Isian tipis: pill, label kolom"],
      ["muted-solid", "muted yang solid, buat sel sticky"],
      ["secondary", "Tombol secondary"],
      ["accent", "Hover menu & tombol ghost"],
      ["field", "Input, select"],
      ["inverse", "Bar gelap melayang (bulk edit)"],
      ["backdrop", "Di belakang dialog"],
    ],
  },
  {
    title: "Chrome (sidebar + top bar)",
    note: "Ikut warna tema user. Isinya pakai tinta tembus pandang + blend-*.",
    tokens: [
      ["chrome", "Sidebar + top bar"],
      ["chrome-hover", "Hover di chrome"],
      ["chrome-active", "Item aktif di chrome"],
      ["chrome-field", "Isian field di chrome"],
      ["thumb", "Thumb segmented / tabs"],
    ],
  },
  {
    title: "Teks",
    tokens: [
      ["heading", "Judul"],
      ["foreground", "Isi"],
      ["muted-foreground", "Sekunder"],
      ["tertiary-foreground", "Meta, petunjuk"],
      ["secondary-foreground", "Teks tombol outline"],
      ["primary-ink", "Teks di atas tint primary"],
      ["neutral-ink", "Teks badge secondary"],
    ],
  },
  {
    title: "Garis dan fokus",
    tokens: [
      ["border", "Hairline (default semua elemen)"],
      ["field-border", "Pinggir field, tombol outline, kartu terang"],
      ["field-border-hover", "Hover-nya"],
      ["input", "Track slider, radio"],
      ["focus-ring", "Halo fokus"],
      ["ring", "Outline default"],
      ["sidebar-border", "Garis di sidebar"],
    ],
  },
  {
    title: "Brand",
    note: "Biru di tema netral; di tema berwarna jadi warna tema yang gelap.",
    tokens: [
      ["primary", "Tombol utama, cek, tab, tautan"],
      ["primary-foreground", "Teks di atas primary"],
    ],
  },
  {
    title: "Baris (tabel & daftar)",
    note: "Solid, jadi tepi sel nggak kelihatan. Dipakai GroupedList / DataTable.",
    tokens: [
      ["row-surface", "Dasar baris"],
      ["row-hover", "Hover"],
      ["row-selected", "Terpilih"],
    ],
  },
]

const STATUS: {
  name: string
  solid: string
  subtle: string
  ink: string
  variant: "success" | "warning" | "info" | "destructive" | "secondary"
  label: string
}[] = [
  {
    name: "success",
    solid: "success",
    subtle: "success-subtle",
    ink: "text-green-11 · text-success-ink",
    variant: "success",
    label: "Disetujui",
  },
  {
    name: "warning",
    solid: "warning",
    subtle: "warning-subtle",
    ink: "text-amber-11",
    variant: "warning",
    label: "Menunggu",
  },
  {
    name: "info",
    solid: "info",
    subtle: "info-subtle",
    ink: "text-blue-11",
    variant: "info",
    label: "Baru",
  },
  {
    name: "destructive",
    solid: "destructive",
    subtle: "destructive-subtle",
    ink: "text-red-11 · text-destructive",
    variant: "destructive",
    label: "Ditolak",
  },
  {
    name: "neutral",
    solid: "neutral-ink",
    subtle: "neutral-subtle",
    ink: "text-neutral-ink",
    variant: "secondary",
    label: "Draf",
  },
]

const PALETTES = [
  "blue",
  "indigo",
  "purple",
  "pink",
  "red",
  "tomato",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "mint",
  "teal",
  "cyan",
]
const STEPS = Array.from({ length: 12 }, (_, i) => i + 1)

const PROJECT_IDS = [
  ["mock-project-a", "Atlas"],
  ["mock-project-b", "Bentala"],
  ["mock-project-c", "Candra"],
  ["mock-project-d", "Dirgantara"],
  ["mock-project-e", "Elang"],
  ["mock-project-f", "Fajar"],
  ["mock-project-g", "Gita"],
] as const

const DONTS: ReactNode[] = [
  "text-gray-*, bg-zinc-*, text-red-500, text-emerald-500, text-neutral-700",
  "bg-[#e5a000], text-[#8C8C8C], style={{ color: '#…' }} di UI aplikasi",
  "text-warning buat kalimat (kuning step 9 susah dibaca di putih)",
  "border-border/50, bg-muted/60, text-muted-foreground/40",
  "border-foreground/10 buat garis (nggak ikut tint, nggak ikut gelap)",
  "dark:text-foreground dan sejenisnya: tokennya sudah ganti sendiri",
  "text-white di atas token permukaan; pakai -foreground milik isiannya",
]

/**
 * /ui → Color: every semantic token as a swatch (live, so it follows the
 * current theme and tint), status sets, the palettes, charts, project
 * colors, a dark preview and what to avoid.
 */
export function ColorTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="color.md">
        Semua warna dari token di globals.css dan palet di palette.css. Swatch
        di sini ikut tema dan warna tema kamu saat ini.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      {GROUPS.map((g) => (
        <DocGroup key={g.title} title={g.title} note={g.note}>
          <div className="flex flex-wrap gap-4">
            {g.tokens.map(([name, note]) => (
              <DocSwatch
                key={name}
                name={`--${name}`}
                note={note}
                style={{ background: `var(--${name})` }}
              />
            ))}
          </div>
        </DocGroup>
      ))}

      <DocGroup
        title="Status"
        note="Solid buat ikon dan titik, subtle buat latar badge, step 11 buat teksnya."
      >
        <div className="flex flex-col gap-6">
          {STATUS.map((s) => (
            <div key={s.name} className="flex flex-wrap items-end gap-4">
              <DocSwatch
                name={`--${s.solid}`}
                note="Solid"
                style={{ background: `var(--${s.solid})` }}
              />
              <DocSwatch
                name={`--${s.subtle}`}
                note="Subtle"
                style={{ background: `var(--${s.subtle})` }}
              />
              <div className="flex w-56 flex-col gap-1.5 pb-1">
                <Badge variant={s.variant}>{s.label}</Badge>
                <code className="font-mono text-xs">{s.ink}</code>
              </div>
            </div>
          ))}
        </div>
      </DocGroup>

      <DocGroup
        title="Palet"
        note="12 langkah ala Radix: 3 latar tint · 6–8 garis · 9 solid · 11 teks · 12 teks kontras. Di gelap 1–8 jadi step 9 tembus pandang."
      >
        <DocExample
          title="Skala oklch"
          source="src/app/palette.css"
          kind="spec"
        >
          <div className="flex flex-col gap-1.5 overflow-x-auto">
            <div className="flex items-center gap-1 pl-16">
              {STEPS.map((n) => (
                <span
                  key={n}
                  className="text-tertiary-foreground w-8 shrink-0 text-center text-[11px] tabular-nums"
                >
                  {n}
                </span>
              ))}
            </div>
            {PALETTES.map((p) => (
              <div key={p} className="flex items-center gap-1">
                <code className="w-16 shrink-0 font-mono text-xs">{p}</code>
                {STEPS.map((n) => (
                  <span
                    key={n}
                    title={`--${p}-${n}`}
                    className={cn(
                      "h-6 w-8 shrink-0 rounded-md",
                      (n === 9 || n === 11) && "ring-foreground/20 ring-1",
                    )}
                    style={{ background: `var(--${p}-${n})` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Chart"
        note="Seri kategori: chartColors (step 9). --chart-1…5 itu gradasi kuning→cokelat, cuma buat data berurutan."
      >
        <DocExample
          title="Seri kategori"
          source="src/shared/lib/chart/utils.ts (chartColors)"
        >
          <div className="flex flex-wrap gap-4">
            {Object.entries(chartColors).map(([key, c]) => (
              <DocSwatch key={key} name={key} note={c.bg} className={c.bg} />
            ))}
          </div>
        </DocExample>
        <DocExample title="Berurutan" source="src/app/globals.css (--chart-N)">
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <DocSwatch
                key={n}
                name={`--chart-${n}`}
                style={{ background: `var(--chart-${n})` }}
              />
            ))}
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Warna project"
        note="Dari hash id, jadi satu project selalu warnanya sama di mana pun."
      >
        <DocExample
          title="ProjectAvatar + projectColorVar"
          source="src/components/project-avatar.tsx"
        >
          <DocCanvas className="flex-col items-stretch gap-3">
            {PROJECT_IDS.map(([id, name]) => (
              <div key={id} className="flex items-center gap-3 text-sm">
                <ProjectAvatar id={id} name={name} />
                <span className="w-24 truncate">{name}</span>
                <span
                  className="h-2 flex-1 rounded-full"
                  style={{
                    background: `color-mix(in oklab, ${projectColorVar(id)} 35%, transparent)`,
                  }}
                />
                <code className="text-tertiary-foreground w-28 font-mono text-xs">
                  {projectColorVar(id)}
                </code>
              </div>
            ))}
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Terang dan gelap"
        note="Contoh yang sama di dalam .dark: semua ganti dari token, tanpa dark: di komponennya."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <DocExample title="Tema sekarang" kind="spec">
            <ThemeSample />
          </DocExample>
          <DocExample title="Selalu gelap (.dark)" kind="spec">
            <div className="dark text-foreground rounded-xl [color-scheme:dark]">
              <ThemeSample />
            </div>
          </DocExample>
        </div>
      </DocGroup>

      <DocGroup title="Fokus dan seleksi">
        <DocExample
          title="Field: border primary/50 + ring-focus-ring"
          source="components/ui/input.tsx"
        >
          <DocCanvas>
            <Input
              className="max-w-xs"
              placeholder="Klik atau Tab ke sini"
              aria-label="Contoh fokus"
            />
            <p className="text-sm">
              Blok teks ini buat dicoba:{" "}
              <span className="text-muted-foreground">
                seleksinya selection:bg-primary/20
              </span>
            </p>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont items={DONTS} />
      </DocGroup>
    </div>
  )
}

/** A small card using only tokens, to compare light and dark. */
function ThemeSample() {
  return (
    <div className="bg-background flex flex-col gap-3 rounded-xl p-4">
      <div className={cn(surfaceClassName, "flex flex-col gap-3 p-4")}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-heading text-[15px]">Pengajuan cuti</span>
          <Badge variant="warning">Menunggu</Badge>
        </div>
        <p className="text-muted-foreground text-sm">Cuti tahunan 12–14 Nov</p>
        <p className="text-tertiary-foreground text-[13px] tabular-nums">
          Diajukan 2 hari lalu
        </p>
        <div className="flex gap-2">
          <Button size="sm">Setujui</Button>
          <Button size="sm" variant="outline">
            Tolak
          </Button>
        </div>
      </div>
      <CalloutBox tone="info">
        Callout ikut palet, jadi gelapnya pas.
      </CalloutBox>
    </div>
  )
}
