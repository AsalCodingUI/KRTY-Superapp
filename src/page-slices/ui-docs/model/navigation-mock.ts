/** Mock data for /ui → Navigasi (nothing is saved). */

export const tabs = [
  { value: "all", label: "Semua", count: 0 },
  { value: "active", label: "Berlaku", count: 12 },
  { value: "draft", label: "Draft", count: 3 },
  { value: "archived", label: "Arsip", count: 0 },
] as const

export const crumbs: { label: string; href?: string }[] = [
  { label: "Aturan", href: "/policies" },
  { label: "Cuti melahirkan", href: "/policies" },
  { label: "Edit" },
]

export const PAGE_SIZE = 3

export const items = [
  "Brand Kit — QA",
  "Website Milxa",
  "Kampanye Ramadan",
  "Aplikasi Kasir",
  "Rebrand Kopi Kenangan Senja",
  "Landing page Santuy",
  "Dashboard HR",
  "Video profil",
]
