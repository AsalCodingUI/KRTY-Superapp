"use client"

import {
  HomeIconLink,
  HomeFooter,
} from "@/app/(main)/dashboard/components/home-card"
import { PageHeader } from "@/components/page-header"
import { ScreenControls } from "@/components/minimal-screen"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RowMenu } from "@/page-slices/projects/ui/workspace/row-menu"
import {
  RiAddLine,
  RiArrowRightLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiMoreFill,
  RiPencilLine,
} from "@/shared/ui/lucide-icons"
import { ChevronDown, Upload } from "@/components/icons"
import Link from "next/link"
import { useState, type ReactNode } from "react"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
} from "./doc-blocks"

const VARIANTS = [
  "default",
  "outline",
  "ghost",
  "secondary",
  "destructive",
  "link",
] as const
const TEXT_SIZES = ["xs", "sm", "default", "lg"] as const
const ICON_SIZES = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const

const RULES: [string, string][] = [
  [
    "Varian",
    "default = satu aksi utama per area · outline = aksi lain di sebelahnya · ghost = aksi tenang (ikon di baris, kartu, header) · destructive = konfirmasi hapus",
  ],
  [
    "Ukuran",
    "default h-8 (header halaman, dialog, form) · sm h-7 (baris, kartu, toolbar) · lg h-10 (aksi Home, layar minimal) · xs h-6 (di dalam field)",
  ],
  [
    "Ikon",
    'Pakai data-icon="inline-start" / "inline-end" di ikonnya; padding sisi itu ngerapiin sendiri',
  ],
  [
    "Ikon saja",
    "Wajib aria-label + Tooltip (bukan title=). icon-sm (28px) yang paling umum",
  ],
  [
    "Loading",
    'disabled + <Spinner data-icon="inline-start" /> + label "Menyimpan…"',
  ],
  [
    "Posisi",
    "Halaman: PageHeader actions, utama paling kanan · Dialog: DialogFooter kanan, Batal (outline) lalu utama; Hapus di kiri",
  ],
  [
    "Link",
    "Navigasi = link: nativeButton={false} render={<Link prefetch={false} />}",
  ],
  [
    "className",
    "Cuma layout (w-full, self-start, ml-auto…), reveal saat hover, text-muted-foreground di ikon ghost. Bukan tinggi, padding, radius, warna",
  ],
]

/** /ui → Tombol: every variant × size, states, and buttons in place. */
export function ButtonTab() {
  const [busy, setBusy] = useState(false)
  const [pinned, setPinned] = useState(false)
  const save = () => {
    setBusy(true)
    window.setTimeout(() => setBusy(false), 1600)
  }

  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="button.md">
        Satu komponen tombol, semua varian dan ukurannya ada di{" "}
        <code className="font-mono text-xs">components/ui/button.tsx</code>.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Varian × ukuran"
        note="Dipakai di app: ghost 191 · outline 133 · default 106 · secondary 20 · destructive 13 · link 1."
      >
        <DocExample
          title="Tombol dengan teks"
          source="components/ui/button.tsx"
        >
          <div className="border-border overflow-x-auto rounded-xl border border-dashed p-5">
            <div className="grid w-max grid-cols-[7rem_repeat(4,auto)] items-center gap-x-6 gap-y-4">
              <span />
              {TEXT_SIZES.map((size) => (
                <code
                  key={size}
                  className="text-muted-foreground font-mono text-xs"
                >
                  {size}
                </code>
              ))}
              {VARIANTS.map((variant) => (
                <VariantRow key={variant} variant={variant}>
                  {TEXT_SIZES.map((size) => (
                    <Button key={size} variant={variant} size={size}>
                      <RiAddLine data-icon="inline-start" />
                      Tambah
                    </Button>
                  ))}
                </VariantRow>
              ))}
            </div>
          </div>
        </DocExample>
        <DocExample title="Tombol ikon" source="components/ui/button.tsx">
          <div className="border-border overflow-x-auto rounded-xl border border-dashed p-5">
            <div className="grid w-max grid-cols-[7rem_repeat(4,5rem)] items-center gap-x-6 gap-y-4">
              <span />
              {ICON_SIZES.map((size) => (
                <code
                  key={size}
                  className="text-muted-foreground font-mono text-xs"
                >
                  {size}
                </code>
              ))}
              {VARIANTS.filter((v) => v !== "link").map((variant) => (
                <VariantRow key={variant} variant={variant}>
                  {ICON_SIZES.map((size) => (
                    <span key={size}>
                      <Button variant={variant} size={size} aria-label="Edit">
                        <RiPencilLine />
                      </Button>
                    </span>
                  ))}
                </VariantRow>
              ))}
            </div>
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="State">
        <DocExample
          title="Ikon di depan / di belakang"
          source='data-icon="inline-start" · data-icon="inline-end"'
        >
          <DocCanvas>
            <Button variant="outline">
              <RiDownloadLine data-icon="inline-start" />
              Unduh
            </Button>
            <Button variant="outline">
              Lanjut
              <RiArrowRightLine data-icon="inline-end" />
            </Button>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Loading"
          source="components/ui/spinner.tsx"
          kind="spec"
        >
          <DocCanvas>
            <Button variant="outline" disabled={busy}>
              Batal
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy && <Spinner data-icon="inline-start" />}
              {busy ? "Menyimpan…" : "Simpan (klik)"}
            </Button>
          </DocCanvas>
        </DocExample>
        <DocExample title="Disabled" source="disabled → opacity-50">
          <DocCanvas>
            <Button disabled>Simpan</Button>
            <Button variant="outline" disabled>
              Ekspor
            </Button>
            <Button variant="ghost" size="icon-sm" disabled aria-label="Hapus">
              <RiDeleteBinLine />
            </Button>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Ditekan (on / off)"
          source="aria-pressed + secondary saat on"
          kind="spec"
        >
          <DocCanvas>
            <Button
              size="sm"
              variant={pinned ? "secondary" : "ghost"}
              aria-pressed={pinned}
              onClick={() => setPinned((v) => !v)}
            >
              {pinned ? "Lead" : "Jadikan lead"}
            </Button>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Hapus (destructive)">
        <DocExample
          title="Konfirmasi hapus"
          source="components/confirm-dialog.tsx"
          kind="spec"
        >
          <DocCanvas>
            <Button variant="outline">Batal</Button>
            <Button variant="destructive">Hapus</Button>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Hapus yang tenang: ikon di baris, teks di kiri footer"
          source='ghost icon-sm "text-muted-foreground hover:text-destructive" · ghost "text-destructive hover:text-destructive"'
          kind="spec"
        >
          <DocCanvas>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Hapus catatan"
              className="text-muted-foreground hover:text-destructive"
            >
              <RiDeleteBinLine />
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
            >
              Hapus langganan
            </Button>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Ikon saja, link, grup">
        <DocExample
          title="Ikon + tooltip"
          source="page-slices/projects/ui/my-notes/MyNotesPage.tsx"
        >
          <DocCanvas>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit"
                    className="text-muted-foreground"
                  />
                }
              >
                <RiPencilLine />
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Aksi lain"
                    className="text-muted-foreground"
                  />
                }
              >
                <RiMoreFill />
              </TooltipTrigger>
              <TooltipContent>Aksi lain</TooltipContent>
            </Tooltip>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Tombol yang jadi link"
          source="nativeButton={false} render={<Link />}"
        >
          <DocCanvas>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/ui?tab=button" prefetch={false} />}
            >
              Buka halaman
            </Button>
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Tombol terbelah (split)"
          source="components/ui/button-group.tsx · ProjectLibrary.tsx"
        >
          <DocCanvas>
            <ButtonGroup>
              <Button>
                <Upload data-icon="inline-start" />
                Unggah
              </Button>
              <Button size="icon" aria-label="Opsi unggah">
                <ChevronDown />
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <Button variant="outline">Minggu</Button>
              <Button variant="outline">Bulan</Button>
            </ButtonGroup>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Di tempatnya">
        <DocExample title="Aksi halaman" source="components/page-header.tsx">
          <div className="border-border rounded-xl border border-dashed p-5">
            <PageHeader
              title="Keuangan"
              back={{ href: "/ui", label: "UI" }}
              actions={
                <>
                  <Button variant="outline">
                    <RiDownloadLine data-icon="inline-start" />
                    <span className="hidden sm:inline">Ekspor</span>
                  </Button>
                  <Button>
                    <RiAddLine data-icon="inline-start" />
                    <span className="hidden sm:inline">Tambah</span>
                  </Button>
                </>
              }
            />
          </div>
        </DocExample>
        <DocExample
          title="Footer dialog"
          source="components/ui/dialog.tsx (DialogFooter)"
          kind="spec"
        >
          <div className="bg-popover max-w-[27.5rem] rounded-3xl p-5 shadow-(--elev-5)">
            <p className="text-sm font-medium">Edit langganan</p>
            <p className="text-muted-foreground mt-1 mb-5 text-sm">
              Isi form di sini.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive sm:mr-auto"
              >
                Hapus
              </Button>
              <Button variant="outline">Batal</Button>
              <Button>Simpan</Button>
            </div>
          </div>
        </DocExample>
        <DocExample
          title="Kartu: ikon di header, link di bawah"
          source="app/(main)/dashboard/components/home-card.tsx (HomeIconLink, HomeFooter)"
        >
          <div className="bg-card flex max-w-sm flex-col gap-4 rounded-2xl p-5 shadow-(--elev-1)">
            <div className="flex items-center justify-between">
              <span className="text-heading text-[15px]">Cuti</span>
              <HomeIconLink href="/leave" label="Buka cuti">
                <RiArrowRightLine />
              </HomeIconLink>
            </div>
            <HomeFooter label="Sisa cuti" value="8 hari" href="/leave" />
          </div>
        </DocExample>
        <DocExample
          title="Menu ⋯ di baris"
          source="page-slices/projects/ui/workspace/row-menu.tsx"
        >
          <DocCanvas>
            <RowMenu
              label="Aksi baris"
              alwaysVisible
              items={[
                { label: "Edit", onSelect: () => {} },
                { label: "Duplikat", onSelect: () => {} },
                {
                  label: "Hapus",
                  onSelect: () => {},
                  destructive: true,
                  separatorBefore: true,
                },
              ]}
            />
          </DocCanvas>
        </DocExample>
        <DocExample
          title="Kontrol layar minimal"
          source="components/minimal-screen.tsx (ScreenControls) · theme-toggle-button.tsx"
        >
          <DocCanvas className="relative h-20 [&>div]:absolute">
            <ScreenControls>
              <ThemeToggleButton className="size-9 rounded-full" />
            </ScreenControls>
          </DocCanvas>
        </DocExample>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            <>
              <code className="font-mono text-xs">
                className=&quot;h-9 px-4&quot;
              </code>{" "}
              atau <code className="font-mono text-xs">text-[13px]</code> di
              tombol: pilih ukuran yang ada.
            </>,
            <>
              Ngulang varian:{" "}
              <code className="font-mono text-xs">
                bg-primary hover:bg-primary/90
              </code>
              , <code className="font-mono text-xs">rounded-full</code>.
            </>,
            <>
              <code className="font-mono text-xs">{"<button>"}</code> mentah
              buat aksi ikon: pakai Button ghost icon-xs / icon-sm.
            </>,
            <>outline + text-destructive (gaya hapus ketiga).</>,
            <>Tombol ikon cuma pakai title=, tanpa aria-label / Tooltip.</>,
            <>Dua tombol default bersebelahan.</>,
          ]}
        />
      </DocGroup>
    </div>
  )
}

function VariantRow({
  variant,
  children,
}: {
  variant: string
  children: ReactNode
}) {
  return (
    <>
      <code className="font-mono text-xs">{variant}</code>
      {children}
    </>
  )
}
