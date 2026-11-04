/** Mock rows and figures for the /ui Motion tab (never saved). */

export const listRows = [
  { id: "r1", name: "Rebranding Kopi Senja", client: "Kopi Senja" },
  { id: "r2", name: "Website Toko Batik", client: "Batik Laras" },
  { id: "r3", name: "Aplikasi Kasir", client: "Warung Pak Darto" },
]

/** Names for rows the demo adds. */
export const extraRows = [
  "Kemasan Teh Melati",
  "Landing Page Klinik",
  "Feed Instagram Q3",
  "Company Profile",
  "Menu Digital",
]

/** Values the number roll cycles through. */
export const figures = ["Rp 12,4 jt", "Rp 18,9 jt", "Rp 9,7 jt", "Rp 21,0 jt"]

export const segments = [
  { value: "week", label: "Minggu" },
  { value: "month", label: "Bulan" },
  { value: "quarter", label: "Kuartal" },
] as const
