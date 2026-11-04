/** Mock numbers for /ui → Layout (no real data). */

export const strip = [
  { key: "members", label: "Anggota", value: 24 },
  { key: "designers", label: "Designer", value: 9 },
  { key: "developers", label: "Developer", value: 11 },
  { key: "pm", label: "Project Manager", value: 3 },
]

export const tiles = [
  { key: "revenue", label: "Pendapatan Q4", value: "Rp 412 jt", hint: "+12%" },
  { key: "open", label: "Invoice terbuka", value: 7, hint: "Rp 96 jt" },
  { key: "projects", label: "Project aktif", value: 18 },
  { key: "hours", label: "Jam tercatat", value: "1.284" },
]

export const breakpoints = [
  ["< 640", "sm", "Dialog jadi sheet dari bawah"],
  ["< 768", "md", "Tanpa sidebar & breadcrumb, tab bar bawah, gutter 20px"],
  ["≥ 768", "md", "Sidebar, breadcrumb, gutter 40px, halaman rounded-3xl"],
  ["≥ 1024", "lg", "Panel samping (Catatan saya) melayang di kanan"],
  ["≥ 1280", "xl", "Gutter 64px"],
] as const
