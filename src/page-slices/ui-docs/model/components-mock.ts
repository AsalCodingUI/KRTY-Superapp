import type { GalleryImage } from "@/components/gallery-strip"

/** Mock content for /ui → Components (no real people, no fetching). */

export const people = [
  { id: "p1", name: "Ayu Lestari", role: "Product Designer" },
  { id: "p2", name: "Bima Pratama", role: "Project Manager" },
  { id: "p3", name: "Citra Wulandari", role: "Frontend Engineer" },
  { id: "p4", name: "Dimas Saputra", role: "Backend Engineer" },
  { id: "p5", name: "Eka Putri", role: "Finance" },
  { id: "p6", name: "Fajar Nugroho", role: "Illustrator" },
]

export const projects = [
  {
    id: "3f9a1c2b-0000-4000-8000-000000000001",
    name: "Brand Kit",
    client: "PT Sinar Makmur",
    due: "20 Des",
  },
  {
    id: "7b583164-0000-4000-8000-000000000002",
    name: "Milxa App",
    client: "Milxa",
    due: "3 Jan",
  },
  {
    id: "c41d77e0-0000-4000-8000-000000000003",
    name: "[QA] Website Kopi",
    client: "Kopi Kenangan Senja",
    due: null,
  },
]

export const homeStats = [
  { label: "Hadir", value: 18 },
  { label: "Cuti", value: 2 },
  { label: "Izin", value: 1 },
  { label: "Belum absen", value: null },
]

export const gallery: GalleryImage[] = [
  { src: "/whats-new/client-report.webp", alt: "Laporan klien" },
  { src: "/whats-new/editor-slash.webp", alt: "Menu slash" },
  { src: "/whats-new/ctx-menu-page.webp", alt: "Menu halaman" },
  { src: "/whats-new/calendar-team-leave.webp", alt: "Cuti tim" },
]

export const markdown = `## Ringkasan minggu ini

Desain **halaman utama** sudah disetujui klien. Sisa revisi kecil di
footer dan ikon sosial.

> [!TIP]
> Aset final ada di Library → *Brand Kit / Final*.

> [!WARNING]
> Tenggat pindah ke **20 Desember**, satu minggu lebih awal.

<details>
<summary>Catatan rapat</summary>

- Warna utama tetap pink Kretya.
- Font judul diganti ke Inter Display.

</details>
`

export const donut = [
  { key: "Desain", value: 46, color: "var(--chart-1)" },
  { key: "Development", value: 32, color: "var(--chart-2)" },
  { key: "Lainnya", value: 22, color: "var(--chart-3)" },
]

export const weekHours = [
  { day: "Sen", hours: 8.5 },
  { day: "Sel", hours: 7 },
  { day: "Rab", hours: 9 },
  { day: "Kam", hours: 6.5 },
  { day: "Jum", hours: 4 },
]
