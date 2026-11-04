import type { LightboxImage } from "@/components/image-lightbox"
import type { ViewerItem } from "@/components/file-viewer"

/** Mock content for /ui → Overlay (static files from public/, no fetching). */

export const lightboxImages: LightboxImage[] = [
  { src: "/whats-new/client-report.webp", alt: "Laporan klien" },
  { src: "/whats-new/ctx-menu-project.webp", alt: "Menu klik kanan project" },
  { src: "/whats-new/editor-embed.webp", alt: "Embed di editor" },
]

const file = (name: string, mime: string, src: string, meta: string) =>
  ({
    key: name,
    name,
    mime,
    meta,
    getUrl: async () => src,
    getDownloadUrl: async () => src,
  }) satisfies ViewerItem

export const viewerItems: ViewerItem[] = [
  file(
    "laporan-klien.webp",
    "image/webp",
    "/whats-new/client-report.webp",
    "184 KB · 12 Okt",
  ),
  file(
    "menu-tabel.webp",
    "image/webp",
    "/whats-new/ctx-menu-table.webp",
    "96 KB · 14 Okt",
  ),
  file(
    "logo-kretya.svg",
    "image/svg+xml",
    "/brand/kretya-logo.svg",
    "4 KB · 2 Nov",
  ),
]

export const previewFiles = [
  {
    name: "laporan-klien.webp",
    mime_type: "image/webp",
    file_path: "mock/laporan-klien.webp",
    url: "/whats-new/client-report.webp",
  },
  {
    name: "brief-final.docx",
    mime_type: "application/msword",
    file_path: "mock/brief-final.doc",
    url: undefined,
  },
] as const

export const sheetFacts = [
  ["Klien", "PT Sinar Makmur"],
  ["Status", "Berjalan"],
  ["Mulai", "3 Okt 2026"],
  ["Tenggat", "20 Des 2026"],
  ["PM", "Bima Pratama"],
  ["Anggaran", "Rp 48.000.000"],
] as const
