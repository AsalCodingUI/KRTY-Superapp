"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bell,
  ChevronDown,
  CircleAlert,
  Download,
  Plus,
  Search,
  X,
} from "@/components/icons"
import { ProjectAvatar } from "@/components/project-avatar"
import { cn } from "@/lib/utils"
// Raw glyphs at the old scaling stroke, only for the "Sebelum" column (the
// app imports icons from @/components/icons, never from the package).
import { Bell01 as RawBell } from "@untitledui/icons/Bell01"
import { Plus as RawPlus } from "@untitledui/icons/Plus"
import { SearchMd as RawSearch } from "@untitledui/icons/SearchMd"
import type { ReactNode } from "react"
import {
  DocCanvas,
  DocDont,
  DocExample,
  DocGroup,
  DocIntro,
  DocRules,
} from "./doc-blocks"

/**
 * Optical balance: what the eye sees vs. what the box says. Numbers come
 * from measuring Geist and the Untitled UI glyphs in the browser (see
 * docs/ui/optical.md). "Sebelum" draws the old values; "Sesudah" is the
 * app's components as they are now.
 */

const RULES: [string, ReactNode][] = [
  [
    "Button padding",
    "Sisi ikon = sisi teks − 2px (ikon size-4 punya ruang kosong ±2.75px). Dipasang di button.tsx (dulu −4 / −2 / −4 / −4)",
  ],
  [
    "Icon balance",
    "Ikon dirancang beda ukuran biar kelihatan sama (lingkaran 90% kotak, plus 66%, X 57%). Jangan dibenerin per ikon; ukuran kotak tetap size-4",
  ],
  [
    "Icon area",
    "Ikon 16px di samping teks 14px: area plus ≈ cap height (10px). Tombol ikon: kotak 28px, ikon 16px, sisa 6px tiap sisi",
  ],
  [
    "Color weight",
    "Garis ikon 1.17px di 16px vs stem huruf 1.4px (450) / 1.55px (500): dulu ikon lebih pucat. Sekarang garis 1.4px tetap di semua ukuran (non-scaling stroke, STROKE)",
  ],
  [
    "Glyph overshoot",
    "Huruf bulat naik/turun 0.22px dari H. Lingkaran kelihatan lebih kecil dari kotak di ukuran sama: avatar bulat vs ProjectAvatar kotak boleh sama size (radius kotak udah ngimbangin)",
  ],
  [
    "Case scale",
    "Nggak ada UPPERCASE di UI. Kalau terpaksa (kbd, label kecil): 1 step lebih kecil + tracking 0.06em",
  ],
  [
    "Button label",
    "font-medium (500), sentence case, tanpa titik, tracking normal. Angka di tombol tabular-nums",
  ],
  [
    "Letter alignment",
    "Huruf tegak (H) punya side bearing 1.25px di 14px tapi 2.14px di 24px: judul besar kelihatan menjorok ±0.9px. PageHeader sekarang ms-[-0.04em]",
  ],
  [
    "Vertical centre",
    "Geist: tengah cap = tengah line box (selisih 0.03px). Teks huruf kecil semua turun ±1.3px: label & badge sentence case",
  ],
]

/** The live area of a glyph inside its 24px box, from the measurement. */
const AREAS: [string, ReactNode, [number, number, number, number]][] = [
  ["Plus", <Plus key="p" className="size-full" />, [4.13, 4.13, 15.75, 15.75]],
  ["X", <X key="x" className="size-full" />, [5.13, 5.13, 13.75, 13.75]],
  [
    "ChevronDown",
    <ChevronDown key="c" className="size-full" />,
    [5.13, 8.13, 13.75, 7.75],
  ],
  [
    "CircleAlert",
    <CircleAlert key="a" className="size-full" />,
    [1.13, 1.13, 21.75, 21.75],
  ],
  ["Bell", <Bell key="b" className="size-full" />, [2.39, 1.13, 19.23, 21.75]],
  [
    "Download",
    <Download key="d" className="size-full" />,
    [2.13, 2.13, 19.75, 19.75],
  ],
]

function Pair({ before, after }: { before: ReactNode; after: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <span className="text-tertiary-foreground text-[13px]">Sebelum</span>
        <DocCanvas>{before}</DocCanvas>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-tertiary-foreground text-[13px]">
          Sesudah (dipasang)
        </span>
        <DocCanvas>{after}</DocCanvas>
      </div>
    </div>
  )
}

export function OpticalTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="optical.md">
        Yang dilihat mata, bukan yang dibilang kotaknya. Angka di sini hasil
        ngukur Geist dan ikon Untitled UI langsung di browser. Padding tombol,
        tebal garis ikon dan rata judul udah dipasang di komponen pusat.
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Button padding"
        note="Ikon punya ruang kosong di kotaknya, jadi sisi ikon harus lebih rapat dari sisi teks. Offset yang konsisten: −2px di semua ukuran."
      >
        <Pair
          before={
            <>
              <Button size="xs" className="has-data-[icon=inline-start]:pl-2">
                <Plus data-icon="inline-start" />
                Tambah
              </Button>
              <Button size="sm">
                <Plus data-icon="inline-start" />
                Tambah
              </Button>
              <Button className="has-data-[icon=inline-start]:pl-2.5">
                <Plus data-icon="inline-start" />
                Tambah
              </Button>
              <Button size="lg" className="has-data-[icon=inline-start]:pl-3">
                <Plus data-icon="inline-start" />
                Tambah
              </Button>
            </>
          }
          after={
            <>
              <Button size="xs">
                <Plus data-icon="inline-start" />
                Tambah
              </Button>
              <Button size="sm">
                <Plus data-icon="inline-start" />
                Tambah
              </Button>
              <Button>
                <Plus data-icon="inline-start" />
                Tambah
              </Button>
              <Button size="lg">
                <Plus data-icon="inline-start" />
                Tambah
              </Button>
            </>
          }
        />
        <p className="text-muted-foreground text-[13px]">
          xs 8→10px · sm 8px (udah pas) · default 10→12px · lg 12→14px. Jarak
          ikon–teks yang kelihatan: gap + ±2.75px ruang kosong ikon.
        </p>
      </DocGroup>

      <DocGroup
        title="Icon area & balance"
        note="Kotak 24px, area yang kelihatan beda-beda. Garis putus-putus = cap height teks 14px (10px) di ikon 16px."
      >
        <div className="flex flex-wrap gap-4">
          {AREAS.map(([name, icon, [x, y, w, h]]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className="bg-muted dark:bg-muted/40 relative size-24 rounded-lg">
                <div className="absolute inset-0 p-0">{icon}</div>
                <div
                  className="border-primary/60 absolute border"
                  style={{
                    left: `${(x / 24) * 100}%`,
                    top: `${(y / 24) * 100}%`,
                    width: `${(w / 24) * 100}%`,
                    height: `${(h / 24) * 100}%`,
                  }}
                />
                <div className="border-destructive/50 absolute inset-x-0 top-[18.75%] bottom-[18.75%] border-y border-dashed" />
              </div>
              <code className="font-mono text-[11px]">{name}</code>
              <span className="text-tertiary-foreground text-[11px]">
                {Math.round((Math.max(w, h) / 24) * 100)}% kotak
              </span>
            </div>
          ))}
        </div>
      </DocGroup>

      <DocGroup
        title="Color weight"
        note="Ikon dan teks dengan warna sama harus kelihatan setebal sama. Dulu garis ikon ikut ukuran (1.75 di 24px → 1.17px di 16px); sekarang 1.4px tetap (= stem Geist 14px)."
      >
        <Pair
          before={
            <div className="flex flex-col gap-3">
              {[
                ["size-3.5", "text-[13px]"],
                ["size-4", "text-sm"],
                ["size-5", "text-[15px]"],
              ].map(([icon, text]) => (
                <span
                  key={icon}
                  className={cn("flex items-center gap-2", text)}
                >
                  <RawBell aria-hidden className={icon} strokeWidth="1.75" />
                  <RawPlus aria-hidden className={icon} strokeWidth="1.75" />
                  Notifikasi baru
                </span>
              ))}
            </div>
          }
          after={
            <div className="flex flex-col gap-3">
              {[
                ["size-3.5", "text-[13px]"],
                ["size-4", "text-sm"],
                ["size-5", "text-[15px]"],
              ].map(([icon, text]) => (
                <span
                  key={icon}
                  className={cn("flex items-center gap-2", text)}
                >
                  <Bell className={icon} />
                  <Plus className={icon} />
                  Notifikasi baru
                </span>
              ))}
            </div>
          }
        />
        <Pair
          before={
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <RawSearch aria-hidden className="size-4" strokeWidth="1.75" />
              Cari project
            </span>
          }
          after={
            <span className="text-muted-foreground flex items-center gap-2 text-sm">
              <Search className="size-4" />
              Cari project
            </span>
          }
        />
      </DocGroup>

      <DocGroup
        title="Glyph overshoot"
        note="Bentuk bulat harus sedikit lebih besar biar kelihatan sama dengan kotak. Font udah ngelakuin ini (O lebih tinggi 0.22px dari H)."
      >
        <DocCanvas className="gap-6">
          <span className="relative text-5xl leading-none">
            <span className="border-destructive/50 absolute inset-x-0 top-[0.27em] bottom-[0.06em] border-y border-dashed" />
            HOH
          </span>
          <div className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarFallback>AL</AvatarFallback>
            </Avatar>
            <ProjectAvatar
              id="mock-a"
              name="Kopi Senja"
              className="size-8 rounded-[5px]"
            />
            <span className="text-muted-foreground text-[13px]">
              bulat vs kotak di size-8
            </span>
          </div>
        </DocCanvas>
      </DocGroup>

      <DocGroup
        title="Case scale"
        note="Huruf kapital semua kelihatan lebih besar dan rapat. Di UI pakai sentence case; kalau terpaksa kapital, kecilin 1 step dan renggangin."
      >
        <Pair
          before={<span className="text-xs font-medium">STATUS AKTIF</span>}
          after={
            <span className="text-[11px] font-medium tracking-[0.06em]">
              STATUS AKTIF
            </span>
          }
        />
      </DocGroup>

      <DocGroup
        title="Button label & vertical centre"
        note="Tengah huruf kapital Geist pas di tengah line box, huruf kecil semua turun ±1.3px. Jadi label & badge sentence case."
      >
        <Pair
          before={
            <>
              <Badge variant="warning">menunggu</Badge>
              <Button variant="outline" size="sm">
                simpan draft
              </Button>
            </>
          }
          after={
            <>
              <Badge variant="warning">Menunggu</Badge>
              <Button variant="outline" size="sm">
                Simpan draft
              </Button>
            </>
          }
        />
      </DocGroup>

      <DocGroup
        title="Letter alignment"
        note="Judul besar kelihatan menjorok dari teks di bawahnya (side bearing ikut ukuran). Garis = tepi gutter."
      >
        <Pair
          before={
            <div className="border-primary/40 flex w-full flex-col gap-1 border-l pl-0">
              <span className="text-heading ms-0 text-2xl tracking-tight">
                Keuangan
              </span>
              <span className="text-muted-foreground text-sm">
                Kas masuk dan keluar
              </span>
            </div>
          }
          after={
            <div className="border-primary/40 flex w-full flex-col gap-1 border-l pl-0">
              <span className="text-heading ms-[-0.04em] text-2xl tracking-tight">
                Keuangan
              </span>
              <span className="text-muted-foreground text-sm">
                Kas masuk dan keluar
              </span>
            </div>
          }
        />
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            "Geser / gedein ikon satu-satu pakai margin atau size custom",
            "Padding sisi ikon sama dengan sisi teks",
            "strokeWidth beda-beda per tempat",
            "UPPERCASE buat label, status, tombol",
            "Label huruf kecil semua (kelihatan turun)",
            "Tengahin teks pakai padding atas/bawah asimetris manual",
          ]}
        />
      </DocGroup>

      <DocExample title="Sumber angka" kind="spec">
        <p className="text-muted-foreground text-[13px]">
          Diukur di browser: canvas measureText (Geist) dan getBBox tiap ikon.
          Lihat docs/ui/optical.md.
        </p>
      </DocExample>
    </div>
  )
}
