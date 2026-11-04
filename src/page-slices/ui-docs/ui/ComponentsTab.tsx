"use client"

import { AppIcon } from "@/components/app-icon"
import {
  HomeCard,
  HomeFigure,
  HomeFooter,
  HomeGrid,
  HomeRow,
  HomeStats,
} from "@/app/(main)/dashboard/components/home-card"
import { AppearancePopover } from "@/components/appearance-popover"
import { AvatarGroup, AvatarOverflow } from "@/components/avatar-group"
import { CalloutBox } from "@/components/callout-box"
import { EmbedBlock } from "@/components/embed-block"
import { EmptyValue, orEmpty } from "@/components/empty-value"
import { FillSlider } from "@/components/fill-slider"
import { GalleryStrip } from "@/components/gallery-strip"
import { InlineText } from "@/components/inline-text"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Markdown } from "@/components/markdown"
import { Panel, PanelEmpty } from "@/components/panel"
import { ProjectAvatar } from "@/components/project-avatar"
import { QuarterFilter } from "@/components/quarter-filter"
import { RichTextField } from "@/components/rich-text-field"
import { RollingValue } from "@/components/rolling-value"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { TimeSelect } from "@/components/time-select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ZoomableImage } from "@/components/zoomable"
import { PersonCell } from "@/page-slices/performance/ui/list"
import { initials } from "@/shared/lib/initials"
import { RiInboxLine } from "@/shared/ui/lucide-icons"
import dynamic from "next/dynamic"
import { useState } from "react"
import * as mock from "../model/components-mock"
import { ComponentsCompare } from "./components-compare"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
} from "./doc-blocks"

// Both are heavy (a WebGL canvas, recharts): loaded only for this tab, as
// the app loads them only where they show.
const GradientASCII = dynamic(
  () => import("@/components/gradient-ascii/GradientASCII"),
  { ssr: false },
)
const Donut = dynamic(
  () => import("@/page-slices/finance/ui/parts").then((m) => m.Donut),
  { ssr: false },
)

const RULES: [string, string][] = [
  [
    "Pakai ulang",
    "Kartu, avatar, tile project, angka, callout: pakai komponennya; varian baru masuk ke komponen",
  ],
  [
    "Kartu",
    "surfaceClassName (bg-card, border, rounded-card); HomeCard = surfaceClassName + p-surface, judul 15px; Panel header 44px bergaris",
  ],
  [
    "Avatar",
    "Orang: Avatar size xs 20 · sm 24 · md 28 · default 32 · lg 40 (prop, bukan className), inisial = initials(); baris orang = PersonCell; project/klien = ProjectAvatar kotak",
  ],
  [
    "Angka",
    "Yang berubah karena filter = RollingValue; kosong = orEmpty() (garis putus), bukan “-” atau 0",
  ],
  [
    "Dokumen",
    "Simpan Markdown; baca pakai Markdown, edit pakai MarkdownDocEditor (lazy)",
  ],
  ["Berat = lazy", "Editor, pdf.js, docx, xlsx, recharts dimuat pas dipakai"],
  [
    "Grafik",
    "Bar sederhana pakai CSS (bar-grow); recharts cuma area/pie, di chunk lazy",
  ],
]

/** /ui → Components: the app's own building blocks, live on mock data. */
export function ComponentsTab() {
  const [count, setCount] = useState(8)
  const [intensity, setIntensity] = useState(60)
  const [quarter, setQuarter] = useState("2026-Q4")
  const [time, setTime] = useState("13:30")
  const [title, setTitle] = useState("Brand Kit — Sinar Makmur")
  const [notes, setNotes] = useState(
    "Kickoff Senin jam 10\n- Bawa moodboard\n- Konfirmasi tenggat",
  )

  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="components.md">
        Komponen buatan app sendiri yang belum dibahas di dokumen lain: kartu,
        avatar, brand, blok dokumen, file, kontrol kecil dan grafik.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Sebelum / sesudah"
        note="Yang tadinya ditulis di tiap halaman sekarang satu sumber: initials(), Avatar size, surfaceClassName di HomeCard, ProjectAvatar buat logo klien. Kiri: kode lama; kanan: yang jalan sekarang."
      >
        <ComponentsCompare />
      </DocGroup>

      <DocGroup title="Kartu">
        <DocExample
          title="HomeCard, HomeFigure, HomeStats, HomeRow, HomeFooter"
          source="app/(main)/dashboard/components/home-card.tsx"
        >
          <HomeGrid>
            <HomeCard title="Kehadiran hari ini">
              <HomeFigure value="18 / 24" unit="orang" hint="Senin, 2 Nov" />
              <HomeStats items={mock.homeStats} />
              <HomeFooter label="Sisa cuti" value="9 hari" href="#" />
            </HomeCard>
            <HomeCard title="Project aktif">
              <div className="flex flex-col">
                {mock.projects.map((p) => (
                  <HomeRow
                    key={p.id}
                    leading={
                      <ProjectAvatar
                        id={p.id}
                        name={p.name}
                        className="size-7 text-xs"
                      />
                    }
                    title={p.name}
                    subtitle={p.client}
                    trailing={orEmpty(p.due)}
                  />
                ))}
              </div>
            </HomeCard>
          </HomeGrid>
        </DocExample>
        <DocExample title="Panel" source="components/panel.tsx">
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <Panel title="Antrean santuy" meta={0}>
              <PanelEmpty
                icon={<RiInboxLine />}
                title="Belum ada antrean"
                description="Yang daftar minggu ini muncul di sini."
              />
            </Panel>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Orang dan project">
        <DocExample title="Avatar" source="components/ui/avatar.tsx">
          <DocCanvas>
            {(["xs", "sm", "md", "default", "lg"] as const).map((size) => (
              <Avatar key={size} size={size}>
                <AvatarFallback>{initials(mock.people[0].name)}</AvatarFallback>
              </Avatar>
            ))}
          </DocCanvas>
        </DocExample>
        <DocExample
          title="AvatarGroup + AvatarOverflow"
          source="components/avatar-group.tsx"
        >
          <DocCanvas>
            <AvatarGroup>
              {mock.people.slice(0, 3).map((p) => (
                <Avatar key={p.id} size="sm">
                  <AvatarFallback>{initials(p.name)}</AvatarFallback>
                </Avatar>
              ))}
              <AvatarOverflow count={mock.people.length - 3} size="sm" />
            </AvatarGroup>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="PersonCell"
          source="page-slices/performance/ui/list.tsx"
        >
          <DocCanvas className="flex-col items-start">
            {mock.people.slice(0, 2).map((p) => (
              <PersonCell
                key={p.id}
                name={p.name}
                avatarUrl={null}
                secondary={p.role}
              />
            ))}
          </DocCanvas>
        </DocExample>
        <DocExample
          title="ProjectAvatar"
          source="components/project-avatar.tsx"
        >
          <DocCanvas>
            {mock.projects.map((p) => (
              <ProjectAvatar key={p.id} id={p.id} name={p.name} />
            ))}
            {mock.projects.map((p) => (
              <ProjectAvatar
                key={`${p.id}-lg`}
                id={p.id}
                name={p.name}
                className="size-9 rounded-[9px] text-sm"
              />
            ))}
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Brand dan tampilan">
        <DocExample title="AppIcon" source="components/app-icon.tsx">
          <DocCanvas>
            <AppIcon size={192} className="size-12 rounded-[15px]" />
            <AppIcon size={96} variant="mark" className="size-[22px]" />
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Tema, warna, bahasa"
          source="theme-switcher.tsx · theme-toggle-button.tsx · appearance-popover.tsx · language-switcher.tsx"
        >
          <DocCanvas>
            <ThemeSwitcher />
            <LanguageSwitcher />
            <ThemeToggleButton />
            <AppearancePopover />
          </DocCanvas>
        </DocExample>
        <DocExample
          title="GradientASCII (isi BrandBackdrop)"
          source="components/brand-backdrop.tsx · gradient-ascii/GradientASCII.jsx"
        >
          <div className="bg-sidebar relative h-48 overflow-hidden rounded-xl dark:bg-[color-mix(in_oklab,var(--background)_55%,black)]">
            <GradientASCII
              colors={[
                "#f7b6d6",
                "#f994c2",
                "#fb7fb4",
                "#fd76a6",
                "#ff8ea6",
                "#ffb3c7",
                "#f0d4ff",
              ]}
              still
              shape="pinch"
              characters=" .·•"
              cellSize={17}
              density={0.52}
              clickEffect="none"
              mouseInteraction={false}
              // Untyped .jsx: TS reads dpr and style as required.
              dpr={1.5}
              style={{}}
            />
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Dokumen">
        <DocExample
          title="Markdown (callout, toggle)"
          source="components/markdown.tsx · shared/lib/doc-blocks.ts"
        >
          <div className="max-w-2xl">
            <Markdown>{mock.markdown}</Markdown>
          </div>
        </DocExample>
        <DocExample title="CalloutBox" source="components/callout-box.tsx">
          <div className="flex max-w-2xl flex-col">
            {(["info", "success", "warning", "danger"] as const).map((tone) => (
              <CalloutBox key={tone} tone={tone} className="my-1.5">
                <p className="text-sm">Callout {tone}: catatan di dokumen.</p>
              </CalloutBox>
            ))}
          </div>
        </DocExample>
        <DocExample title="EmbedBlock" source="components/embed-block.tsx">
          <div className="max-w-md">
            <EmbedBlock
              url="https://www.figma.com/design/abc123/brand-kit"
              title="Brand Kit — Figma"
              view="card"
            />
          </div>
        </DocExample>
        <DocExample title="GalleryStrip" source="components/gallery-strip.tsx">
          <GalleryStrip images={mock.gallery} />
        </DocExample>
        <DocExample
          title="RichTextField"
          source="components/rich-text-field.tsx"
        >
          <div className="max-w-md">
            <RichTextField
              value={notes}
              onChange={setNotes}
              placeholder="Tulis catatan"
              aria-label="Catatan"
              className="text-sm"
            />
          </div>
        </DocExample>
        <DocExample title="InlineText" source="components/inline-text.tsx">
          <InlineText
            value={title}
            onSave={setTitle}
            required
            aria-label="Nama project"
            className="text-heading text-lg"
          />
        </DocExample>
      </DocGroup>

      <DocGroup
        title="File"
        note="PdfPages / DocxPages / SheetView butuh file asli: lihat Overlay → Viewer file."
      >
        <DocExample
          title="ZoomableImage (cubit buat zoom)"
          source="components/zoomable.tsx"
        >
          <div className="bg-muted dark:bg-muted/40 h-56 overflow-hidden rounded-xl">
            <ZoomableImage
              src="/brand/kretya-logo.svg"
              alt="Logo Kretya"
              name="kretya-logo.svg"
              className="size-full"
            />
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Kontrol kecil dan angka">
        <DocExample title="RollingValue" source="components/rolling-value.tsx">
          <DocCanvas>
            <span className="text-heading text-[1.75rem] tabular-nums">
              <RollingValue>{count}</RollingValue>
            </span>
            <Button variant="outline" onClick={() => setCount((c) => c + 1)}>
              Tambah
            </Button>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="EmptyValue / orEmpty"
          source="components/empty-value.tsx"
        >
          <DocCanvas>
            <span className="text-sm">
              Tenggat: <EmptyValue />
            </span>
          </DocCanvas>
        </DocExample>
        <DocExample title="FillSlider" source="components/fill-slider.tsx">
          <div className="max-w-xs">
            <FillSlider
              label="Intensitas"
              value={intensity}
              onChange={setIntensity}
            />
          </div>
        </DocExample>
        <DocExample
          title="QuarterFilter"
          source="components/quarter-filter.tsx"
        >
          <DocCanvas>
            <QuarterFilter
              value={quarter}
              onChange={setQuarter}
              years={[2025, 2026, 2027]}
            />
          </DocCanvas>
        </DocExample>
        <DocExample title="TimeSelect" source="components/time-select.tsx">
          <div className="max-w-40">
            <TimeSelect value={time} onValueChange={setTime} />
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Grafik">
        <DocExample
          title="Bar CSS (bar-grow-y)"
          source="app/globals.css · dashboard/components/week-hours.tsx"
          kind="spec"
        >
          <DocCanvas className="items-end gap-4">
            {mock.weekHours.map((d) => (
              <div key={d.day} className="flex flex-col items-center gap-1.5">
                <div className="bg-muted relative h-28 w-6 overflow-hidden rounded-full">
                  <div
                    className="bar-grow-y bg-blue-9 absolute inset-x-0 bottom-0 rounded-full"
                    style={
                      {
                        "--bar": `${(d.hours / 10) * 100}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
                <span className="text-muted-foreground text-xs">{d.day}</span>
              </div>
            ))}
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Donut (recharts, lazy)"
          source="page-slices/finance/ui/parts.tsx"
        >
          <DocCanvas>
            <Donut data={mock.donut} label="Rp 412 jt" sublabel="Q4 2026" />
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            "bg-card border rounded-xl p-5 disalin ke halaman (pakai HomeCard / surfaceClassName)",
            "name.slice(0, 2).toUpperCase() atau helper inisial lokal (pakai initials())",
            'Avatar className="size-7" (pakai size="md")',
            "Tile huruf berwarna buat project dibikin manual (pakai ProjectAvatar)",
            "“-” atau 0 untuk angka yang kosong (pakai orEmpty)",
            "Import doc-editor, recharts, pdfjs langsung ke halaman yang tampil di awal",
            "BrandBackdrop di dalam app atau di belakang konten yang scroll",
          ]}
        />
      </DocGroup>
    </div>
  )
}
