/** Mock rows for /ui → Spacing (never saved; no real people). */

export const gutterRows = [
  { name: "Rebrand Kopi Senja", client: "PT Senja Rasa", status: "Aktif" },
  { name: "Landing page Q3", client: "Nusa Travel", status: "Review" },
  { name: "Aplikasi kasir", client: "Toko Maju", status: "Aktif" },
]

export const cardRows = [
  { title: "Figma Professional", subtitle: "Bulanan", trailing: "Rp 225.000" },
  { title: "Vercel Pro", subtitle: "Bulanan", trailing: "Rp 320.000" },
  { title: "Google Workspace", subtitle: "Tahunan", trailing: "Rp 1.440.000" },
]

export const paneLines = Array.from(
  { length: 12 },
  (_, i) =>
    `Baris isi ke-${i + 1}: teksnya mulai di jarak yang sama dari kiri dan kanan.`,
)
