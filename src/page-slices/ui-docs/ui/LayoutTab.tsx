"use client"

import { AppIcon } from "@/components/app-icon"
import {
  GlassLayer,
  glassControlClass,
  glassSurfaceClass,
  screenBackgroundClass,
  screenLogoClass,
  screenTextClass,
  screenTitleClass,
} from "@/components/minimal-screen"
import { PageHeader } from "@/components/page-header"
import { SectionTitle } from "@/components/section-title"
import { StatStrip } from "@/components/stat-strip"
import { StatTiles } from "@/components/stat-tiles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { RiAddLine, RiDownloadLine } from "@/shared/ui/lucide-icons"
import type { ReactNode } from "react"
import * as mock from "../model/layout-mock"
import { LayoutCompare } from "./layout-compare"
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
  [
    "Halaman",
    "Mulai dengan PageHeader pt-6 pb-4 → tab → StatStrip → baris cari (pt-4 pb-3) → isi",
  ],
  [
    "Judul",
    "Satu h1 per halaman, punya PageHeader: text-2xl font-normal; tanpa deskripsi di bawahnya",
  ],
  [
    "Kembali",
    "back={{ href, label }}: tombol ← kotak (outline icon-sm) + tooltip “Kembali ke …”",
  ],
  [
    "Gutter",
    "gutter-x: 20px di HP, 40px dari md, 64px dari xl (dikurangi lebar scrollbar); jangan px-10",
  ],
  ["Full bleed", "bleed gutter-x: sampai tepi halaman, isi tetap di gutter"],
  [
    "Scroll",
    "Halaman satu-satunya yang scroll; panel scroll = scroll-pane pane-px-5",
  ],
  [
    "Angka",
    "StatStrip di bawah judul/tab (tanpa kartu; aside buat tombol, orEmpty buat yang kosong); StatTiles kalau di kartu",
  ],
  [
    "Layar minimal",
    "Login, brief, PIN, laporan klien, 404: MinimalScreen + satu MinimalCard",
  ],
  [
    "Aplikasi Mac",
    "Top bar 52px dengan traffic light, halaman radius 10px; cek pakai useMacChrome()",
  ],
  [
    "Lembar halaman",
    "PageSheet (components/page-sheet.tsx) dipakai app dan portal klien; jangan salin class-nya",
  ],
  ["HP", "Di bawah 768px: tanpa sidebar & breadcrumb, tab bar di bawah"],
]

/** /ui → Layout: the shell, a page's parts, stats and minimal screens. */
export function LayoutTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="layout.md">
        Susunan layar: kerangka app (top bar, sidebar, lembar halaman), header
        halaman, angka, layar minimal, app desktop, HP dan cetak.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Sebelum / sesudah"
        note="Salinan yang sekarang lewat satu komponen: PageSheet (app + portal), StatStrip (StatBand dan salinan di Anggota), sapaan dashboard lewat PageHeader. Kiri: markup lama; kanan: yang jalan sekarang."
      >
        <LayoutCompare />
      </DocGroup>

      <DocGroup
        title="Anatomi"
        note="app/(main)/layout.tsx — chrome berwarna, halaman melayang di atasnya sebagai satu lembar rounded."
      >
        <DocExample
          title="Kerangka app"
          source="app/(main)/layout.tsx"
          kind="spec"
        >
          <Anatomy />
        </DocExample>
        <DocExample title="Breakpoint" kind="spec">
          <div className="flex flex-col">
            {mock.breakpoints.map(([width, name, what]) => (
              <DocToken key={width} name={`${width}px (${name})`}>
                <span className="text-sm">{what}</span>
              </DocToken>
            ))}
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Header halaman">
        <DocExample title="Judul saja" source="components/page-header.tsx">
          <Frame>
            <PageHeader title="Tim" />
          </Frame>
        </DocExample>
        <DocExample title="Dengan aksi" source="components/page-header.tsx">
          <Frame>
            <PageHeader
              title="Invoice"
              actions={
                <>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Unduh"
                        />
                      }
                    >
                      <RiDownloadLine />
                    </TooltipTrigger>
                    <TooltipContent>Unduh</TooltipContent>
                  </Tooltip>
                  <Button>
                    <RiAddLine data-icon="inline-start" />
                    Invoice baru
                  </Button>
                </>
              }
            />
          </Frame>
        </DocExample>
        <DocExample
          title="Dengan tombol kembali"
          source="components/page-header.tsx · performance/ui/kpi/EmployeeKpiPage.tsx"
        >
          <Frame>
            <PageHeader
              title="Citra Wulandari"
              back={{ onClick: () => {}, label: "KPI tim" }}
            />
          </Frame>
        </DocExample>
      </DocGroup>

      <DocGroup title="Angka">
        <DocExample
          title="StatStrip (di bawah judul / tab)"
          source="components/stat-strip.tsx"
        >
          <Frame>
            <PageHeader title="Tim" />
            <StatStrip items={mock.strip} />
            <div className="pt-4 pb-3">
              <Input
                type="search"
                placeholder="Cari anggota"
                className="w-full sm:w-[260px]"
              />
            </div>
          </Frame>
        </DocExample>
        <DocExample title="StatTiles" source="components/stat-tiles.tsx">
          <div className="flex flex-col gap-6">
            <StatTiles items={mock.tiles} />
            <StatTiles items={mock.tiles.slice(0, 3)} variant="strip" />
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Bagian di halaman">
        <DocExample title="SectionTitle" source="components/section-title.tsx">
          <Frame>
            <SectionTitle
              extra={12}
              actions={
                <Button variant="ghost" size="sm">
                  Lihat semua
                </Button>
              }
            >
              Bulan ini
            </SectionTitle>
            <p className="text-muted-foreground pb-6 text-sm">
              Isi bagian (daftar, kartu) di bawahnya.
            </p>
          </Frame>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Layar minimal"
        note="Di luar app (login, brief, PIN portal, laporan klien, 404). Di sini latarnya gradasi diam; aslinya BrandBackdrop (kanvas, fixed)."
      >
        <DocExample
          title="MinimalCard"
          source="components/minimal-screen.tsx · app/(fullscreen)/login/page.tsx"
        >
          <div
            className={cn(
              screenBackgroundClass,
              "relative isolate flex items-center justify-center overflow-hidden rounded-xl p-6 sm:p-10",
            )}
          >
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_20%,#fb7fb4_0%,transparent_55%),radial-gradient(ellipse_at_80%_90%,#e9c6f7_0%,transparent_50%)] opacity-70"
            />
            <div
              className={cn(
                glassSurfaceClass,
                "z-10 w-full max-w-lg rounded-[24px] px-6 py-12 sm:px-10 sm:py-14",
              )}
            >
              <GlassLayer />
              <div className="mx-auto flex max-w-sm flex-col items-center gap-6 text-center">
                <AppIcon size={192} className={screenLogoClass} />
                <div className="flex flex-col gap-2">
                  <h2 className={screenTitleClass}>Masuk ke Kretya</h2>
                  <p className={screenTextClass}>
                    Pakai email kantor kamu. Link masuk dikirim ke inbox.
                  </p>
                </div>
                <Input
                  placeholder="nama@kretya.studio"
                  className={glassControlClass}
                />
                <Button size="lg" className="w-full">
                  Kirim link
                </Button>
              </div>
            </div>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            "h1 buatan sendiri, atau deskripsi di bawah judul",
            "px-* / mx-auto max-w-* di halaman (pakai gutter)",
            "overflow-y-auto + px-5 untuk panel scroll (pakai scroll-pane pane-px-5)",
            "Salin markup stat-strip ke halaman (pakai StatStrip)",
            "Header sticky dengan backdrop-blur",
            "Cek userAgent buat app desktop (pakai useMacChrome / useDesktopShell)",
          ]}
        />
      </DocGroup>
    </div>
  )
}

/** A strip of page background on the page gutter, to show a page part. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="border-border gutter-x flex flex-col rounded-xl border border-dashed">
      {children}
    </div>
  )
}

/** The (main) layout as boxes: chrome, top bar, sidebar, page sheet. */
function Anatomy() {
  return (
    <DocCanvas className="block p-0">
      <div className="bg-chrome flex flex-col overflow-hidden rounded-xl text-[12px]">
        <Box
          className="h-11 items-center"
          label="AppTopbar"
          note="cuma HP (56px) · Mac: strip 52px lampu + toggle + tab"
        />
        <Box
          className="mx-2 mb-2 h-7 rounded-md border border-dashed"
          label="AppBannerStack"
          note="view-as, pengumuman · --app-banner-height"
        />
        <div className="flex min-h-72 gap-0 pr-3 pb-3 max-md:pr-0 max-md:pb-0">
          <Box
            className="w-40 shrink-0 flex-col items-start gap-1 max-md:hidden"
            label="AppSidebar"
            note="brand ‹ › ◫ · workspace · cari + lonceng · … · akun"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <Box
              className="h-9 items-center"
              label="SiteHeader"
              note="baris tab di chrome · h-11 · diam, cuma sheet yang scroll"
            />
            <div className="bg-background dark:bg-surface flex min-w-0 flex-1 flex-col rounded-3xl shadow-(--elev-3) max-md:rounded-t-3xl max-md:rounded-b-none">
              <div className="flex flex-1 flex-col gap-2 p-3">
                <span className="text-muted-foreground">
                  SidebarInset · scroll-pane · rounded-3xl (Mac 10px) · konten
                  gutter-x pb-6
                </span>
                <div className="border-primary/40 bg-primary/5 flex h-9 items-center rounded-lg border border-dashed px-3">
                  PageHeader pt-6 pb-4
                </div>
                <div className="border-border flex h-8 items-center rounded-lg border border-dashed px-3">
                  TabNavigation · StatStrip
                </div>
                <div className="border-border flex flex-1 items-center rounded-lg border border-dashed px-3">
                  Isi halaman (GroupedList, kartu…)
                </div>
              </div>
            </div>
          </div>
        </div>
        <Box
          className="h-9 items-center justify-center md:hidden"
          label="MobileNav"
          note="tab bar melayang, cuma di HP"
        />
      </div>
    </DocCanvas>
  )
}

function Box({
  label,
  note,
  className,
}: {
  label: string
  note: string
  className?: string
}) {
  return (
    <div className={cn("flex gap-2 px-3 py-2", className)}>
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{note}</span>
    </div>
  )
}
