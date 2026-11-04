/** Mock content for /ui → Typography (never saved; no real people). */

export const stats = [
  { key: "left", label: "Sisa cuti", value: "8 hari" },
  { key: "used", label: "Terpakai", value: "4 hari" },
  { key: "pending", label: "Menunggu", value: "2" },
]

/** The same number set, to show why columns need tabular-nums. */
export const amounts = ["Rp 1.111.111", "Rp 8.888.888", "Rp 4.070.000"]

/** An English label and its Indonesian copy (usually longer). */
export const i18nPairs: [string, string][] = [
  ["Save", "Simpan perubahan"],
  ["Leave balance", "Sisa jatah cuti tahunan"],
  ["Pending approval", "Menunggu persetujuan atasan"],
]

export const longTitle =
  "Rebranding identitas visual dan panduan merek untuk PT Nusantara Kreatif Abadi"

export const longText =
  "Pengajuan ini mencakup cuti tahunan selama tiga hari kerja, termasuk satu hari pengganti karena lembur di akhir pekan sebelumnya, dan sudah dikoordinasikan dengan tim proyek."

export const markdown = `# Aturan kerja remote

Karyawan boleh bekerja dari mana saja **selama jam inti** (10.00–15.00 WIB) tetap bisa dihubungi.

## Peralatan

- Laptop dari kantor, dengan [panduan keamanan](https://example.com)
- Kode akses \`VPN-2026\` diminta ke tim IT
`
