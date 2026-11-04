"use client"

import { AppIcon } from "@/components/app-icon"
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  Copy,
  Delete,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Info,
  Lock,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCW,
  Search,
  Settings,
  SlidersHorizontal,
  SquarePen,
  TriangleAlert,
  Upload,
  User,
  Users,
  X,
} from "@/components/icons"
import { ProjectAvatar } from "@/components/project-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LeaveStatusIcon } from "@/page-slices/leave/ui/components/StatusIcon"
import { ProjectStageIcon } from "@/page-slices/projects/ui/ProjectStageIcon"
import { ProjectStatusIcon } from "@/page-slices/projects/ui/ProjectStatusIcon"
import {
  TASK_PRIORITIES,
  TaskPriorityIcon,
} from "@/page-slices/projects/ui/workspace/TaskPriority"
import { ALL_STATUSES, PROJECT_STAGES } from "@/page-slices/projects/lib/status"
import {
  BellFilled,
  CalendarCheckFilled,
  ChartFilled,
  CheckCircleFilled,
  ClockFilled,
  FileFilled,
  FolderFilled,
  MessageFilled,
} from "@/widgets/notifications/ui/notification-icons"
import * as AppIcons from "@/components/icons"
import type { ComponentType, ReactNode } from "react"
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
    "Sumber",
    "@/components/icons: Untitled UI Icons, nama tetap gaya lucide. Jangan import @untitledui/icons langsung. Ri* = alias lama, jangan nambah",
  ],
  [
    "Satu arti satu ikon",
    "Edit = SquarePen · hapus = Delete · lainnya = MoreHorizontal · tutup = X",
  ],
  [
    "Ukuran",
    "size-4 default · size-3.5 di teks 13px / chip / tab · size-3 di badge · size-5 empty state",
  ],
  [
    "Di tombol",
    'data-icon="inline-start" / "inline-end", tanpa kelas ukuran (tombolnya yang ngatur)',
  ],
  ["Tombol ikon", 'size="icon-sm" + aria-label (title doang bukan label)'],
  [
    "Warna",
    "Ikut currentColor; pelan: text-muted-foreground; status: token semantik",
  ],
  [
    "Gaya",
    "Line saja (versi gratis Untitled UI nggak punya filled). weight diabaikan",
  ],
  [
    "Stroke",
    "1.4px tetap di semua ukuran (non-scaling, = stem Geist 14px), diatur sekali di STROKE. strokeWidth per ikon diabaikan",
  ],
  [
    "Animasi",
    "Ikon statis (lebih ringan). Gerak cukup dari tombol / komponennya",
  ],
  ["Tulisan", "size-*, bukan h-4 w-4"],
]

const SIZES = [
  { name: "size-3", value: "12px · badge, Button xs", cls: "size-3" },
  { name: "size-3.5", value: "14px · chip, tab, teks 13px", cls: "size-3.5" },
  { name: "size-4", value: "16px · default", cls: "size-4" },
  { name: "size-5", value: "20px · tile empty state", cls: "size-5" },
]

/** The icons pages reach for most, by meaning. */
const COMMON: [string, ComponentType<{ className?: string }>, string][] = [
  ["Plus", Plus, "Tambah"],
  ["SquarePen", SquarePen, "Edit"],
  ["Delete", Delete, "Hapus"],
  ["X", X, "Tutup"],
  ["MoreHorizontal", MoreHorizontal, "Menu lainnya"],
  ["Search", Search, "Cari"],
  ["Copy", Copy, "Salin"],
  ["Download", Download, "Unduh"],
  ["Upload", Upload, "Unggah"],
  ["ExternalLink", ExternalLink, "Buka di tab baru"],
  ["Eye", Eye, "Lihat"],
  ["Check", Check, "Pilih / selesai"],
  ["ChevronDown", ChevronDown, "Buka grup / pilihan"],
  ["ChevronRight", ChevronRight, "Masuk"],
  ["ArrowLeft", ArrowLeft, "Kembali"],
  ["ArrowRight", ArrowRight, "Lanjut"],
  ["RefreshCW", RefreshCW, "Coba lagi"],
  ["SlidersHorizontal", SlidersHorizontal, "Filter / atur"],
  ["Settings", Settings, "Pengaturan"],
  ["Bell", Bell, "Notifikasi"],
  ["CalendarDays", CalendarDays, "Tanggal"],
  ["Clock", Clock, "Waktu"],
  ["User", User, "Orang"],
  ["Users", Users, "Tim"],
  ["Mail", Mail, "Email"],
  ["FileText", FileText, "Dokumen"],
  ["FolderOpen", FolderOpen, "Folder"],
  ["Archive", Archive, "Arsip"],
  ["Lock", Lock, "Terkunci"],
  ["CircleCheck", CircleCheck, "Berhasil"],
  ["TriangleAlert", TriangleAlert, "Peringatan"],
  ["CircleAlert", CircleAlert, "Error"],
  ["Info", Info, "Info"],
]

const FILLED: [string, ComponentType<{ className?: string }>][] = [
  ["BellFilled", BellFilled],
  ["CalendarCheckFilled", CalendarCheckFilled],
  ["ClockFilled", ClockFilled],
  ["MessageFilled", MessageFilled],
  ["CheckCircleFilled", CheckCircleFilled],
  ["FolderFilled", FolderFilled],
  ["FileFilled", FileFilled],
  ["ChartFilled", ChartFilled],
]

/**
 * /ui → Icons: where icons come from, the size per context, the icons
 * pages use most (hover one to see it animate), the app's own glyphs, and
 * icons in buttons, chips and badges.
 */
export function IconsTab() {
  return (
    <div className="flex flex-col gap-14">
      <DocIntro doc="icons.md">
        Ikon dari satu sumber, ukurannya ngikut konteks, dan glyph khusus
        aplikasi (status, tahap, prioritas).
      </DocIntro>

      <DocGroup title="Aturan">
        <DocRules rules={RULES} />
      </DocGroup>

      <DocGroup
        title="Semua ikon app"
        note="Tiap nama ikon yang dipakai app (Untitled UI, garis 1.4px tetap). Yang ditandai custom digambar sendiri karena belum ada di Untitled UI."
      >
        <AllIcons />
      </DocGroup>

      <DocGroup title="Ukuran">
        <DocExample title="Skala" source="size-* (Tailwind)" kind="spec">
          <div className="flex flex-col">
            {SIZES.map((s) => (
              <DocToken key={s.name} name={s.name} value={s.value}>
                <div className="flex items-center gap-3">
                  <CalendarDays className={s.cls} />
                  <SquarePen className={s.cls} />
                  <Bell className={s.cls} />
                </div>
              </DocToken>
            ))}
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup
        title="Ikon yang sering dipakai"
        note="Arahkan mouse ke kotaknya: ikonnya beranimasi karena parent-nya bisa diklik."
      >
        <DocExample
          title="@/components/icons"
          source="components/icons/index.ts"
        >
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
            {COMMON.map(([name, Icon, meaning]) => (
              <button
                key={name}
                type="button"
                className="hover:bg-muted flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 ease-out"
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex min-w-0 flex-col">
                  <code className="truncate font-mono text-xs">{name}</code>
                  <span className="text-tertiary-foreground truncate text-[13px]">
                    {meaning}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </DocExample>
      </DocGroup>

      <DocGroup title="Di dalam komponen">
        <div className="grid gap-8 md:grid-cols-2">
          <DocExample
            title="Tombol dengan ikon"
            source="components/ui/button.tsx"
          >
            <DocCanvas>
              <Button size="sm">
                <Plus data-icon="inline-start" />
                Project baru
              </Button>
              <Button variant="outline" size="sm">
                Buka
                <ExternalLink data-icon="inline-end" />
              </Button>
              <Button variant="outline" size="xs">
                <Download data-icon="inline-start" />
                Unduh
              </Button>
            </DocCanvas>
          </DocExample>
          <DocExample
            title="Tombol ikon (pakai aria-label)"
            source="components/ui/button.tsx"
          >
            <DocCanvas>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit"
                title="Edit"
              >
                <SquarePen />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Hapus"
                title="Hapus"
              >
                <Delete />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Menu lainnya"
                title="Menu lainnya"
              >
                <MoreHorizontal />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Cari"
                title="Cari"
              >
                <Search />
              </Button>
            </DocCanvas>
          </DocExample>
          <DocExample title="Teks 13px dan chip" source="size-3.5 shrink-0">
            <DocCanvas>
              <span className="text-muted-foreground flex items-center gap-1.5 text-[13px]">
                <CalendarDays className="size-3.5 shrink-0" />
                12 Nov
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5 text-[13px]">
                <Users className="size-3.5 shrink-0" />4 orang
              </span>
            </DocCanvas>
          </DocExample>
          <DocExample
            title="Badge (ikon 12px dari Badge)"
            source="components/ui/badge.tsx"
          >
            <DocCanvas>
              <Badge variant="success">
                <CircleCheck data-icon="inline-start" />
                Lunas
              </Badge>
              <Badge variant="warning">
                <Clock data-icon="inline-start" />
                Jatuh tempo
              </Badge>
            </DocCanvas>
          </DocExample>
        </div>
      </DocGroup>

      <DocGroup
        title="Glyph aplikasi"
        note="Digambar sendiri: viewBox 16, currentColor, aria-hidden, size-4 shrink-0."
      >
        <div className="grid gap-8 md:grid-cols-2">
          <DocExample
            title="Status project"
            source="page-slices/projects/ui/ProjectStatusIcon.tsx"
          >
            <GlyphRow
              items={ALL_STATUSES.map((s) => [
                s,
                <ProjectStatusIcon key={s} status={s} />,
              ])}
            />
          </DocExample>
          <DocExample
            title="Prioritas task"
            source="page-slices/projects/ui/workspace/TaskPriority.tsx"
          >
            <GlyphRow
              items={TASK_PRIORITIES.map((p) => [
                p,
                <TaskPriorityIcon key={p} priority={p} />,
              ])}
            />
          </DocExample>
          <DocExample
            title="Tahap project"
            source="page-slices/projects/ui/ProjectStageIcon.tsx"
          >
            <GlyphRow
              items={PROJECT_STAGES.map((s) => [
                s,
                <ProjectStageIcon key={s} stage={s} />,
              ])}
            />
          </DocExample>
          <DocExample
            title="Status cuti"
            source="page-slices/leave/ui/components/StatusIcon.tsx"
          >
            <GlyphRow
              items={["pending", "approved", "rejected"].map((s) => [
                s,
                <LeaveStatusIcon key={s} status={s} />,
              ])}
            />
          </DocExample>
          <DocExample
            title="Notifikasi (filled)"
            source="widgets/notifications/ui/notification-icons.tsx"
          >
            <div className="flex flex-wrap gap-2">
              {FILLED.map(([name, Icon]) => (
                <span
                  key={name}
                  title={name}
                  className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-lg"
                >
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
          </DocExample>
          <DocExample
            title="App icon dan avatar project"
            source="components/app-icon.tsx · components/project-avatar.tsx"
          >
            <div className="flex items-center gap-4">
              <AppIcon size={192} className="size-10 rounded-[12px]" />
              <AppIcon size={96} variant="mark" className="size-4" />
              <ProjectAvatar id="mock-project-1" name="Kopi Senja" />
              <ProjectAvatar id="mock-project-2" name="Batik Laras" />
              <ProjectAvatar id="mock-project-3" name="[QA] Milxa" />
            </div>
          </DocExample>
        </div>
      </DocGroup>

      <DocGroup title="Jangan">
        <DocDont
          items={[
            <>
              <code className="font-mono text-xs">h-4 w-4</code> (pakai{" "}
              <code className="font-mono text-xs">size-4</code>), atau kelas
              ukuran di ikon dalam Button / EmptyState / Badge
            </>,
            "Ikon + animate-spin buat loading (pakai Spinner)",
            "Trash2 / Pencil buat hapus / edit (pakai Delete / SquarePen)",
            "Tombol ikon cuma pakai title, atau tanpa label sama sekali",
            "Warna palet mentah (text-orange-500), hex, atau !important di ikon",
            "strokeWidth per ikon (ketebalan cuma diatur di STROKE)",
            "Alias Ri* baru di kode baru",
          ]}
        />
      </DocGroup>
    </div>
  )
}

function GlyphRow({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {items.map(([label, glyph]) => (
        <span key={label} className="flex items-center gap-1.5 text-[13px]">
          {glyph}
          <code className="text-muted-foreground font-mono text-xs">
            {label}
          </code>
        </span>
      ))}
    </div>
  )
}

/** Not in Untitled UI: drawn in components/icons/custom.tsx. */
const CUSTOM = new Set(["Coffee"])

function AllIcons() {
  const icons = Object.entries(AppIcons).filter(
    (e): e is [string, AppIcons.Icon] =>
      /^[A-Z]/.test(e[0]) && typeof e[1] === "object",
  )
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2">
      {icons.map(([name, Icon]) => (
        <div
          key={name}
          className="bg-muted dark:bg-muted/40 flex flex-col gap-2 rounded-lg p-3"
        >
          <div className="flex items-center gap-3">
            <Icon className="size-5" />
          </div>
          <code className="truncate font-mono text-[11px]" title={name}>
            {name}
          </code>
          {CUSTOM.has(name) && (
            <span className="text-tertiary-foreground text-[11px]">custom</span>
          )}
        </div>
      ))}
    </div>
  )
}
