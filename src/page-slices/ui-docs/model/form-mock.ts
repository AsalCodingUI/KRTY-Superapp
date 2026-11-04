import type { FileDropCanvasLabels } from "@/components/file-drop-canvas"

/** Mock options for /ui → Form (nothing is saved). */

export const currencies = ["IDR", "USD", "SGD", "EUR"]

export const roles: [string, string][] = [
  ["design", "Product Designer"],
  ["frontend", "Frontend Engineer"],
  ["backend", "Backend Engineer"],
  ["pm", "Project Manager"],
]

export const countries = [
  "Indonesia",
  "Singapura",
  "Malaysia",
  "Thailand",
  "Vietnam",
  "Filipina",
  "Jepang",
  "Korea Selatan",
  "Australia",
  "Belanda",
  "Jerman",
  "Inggris",
  "Amerika Serikat",
  "Kanada",
]

export const schedules: [string, string][] = [
  ["full", "Lunas sekali bayar"],
  ["dp", "DP + pelunasan"],
  ["milestone", "Per milestone"],
]

export const settings: [string, string][] = [
  ["Email notifikasi", "Kirim ringkasan ke ayu@example.com"],
  ["Persetujuan cuti", "Kabari waktu ada pengajuan baru"],
]

export const richText =
  "Ruang lingkup:\n- Logo\n- Panduan brand\n- Template sosial media"

export const dropLabels: FileDropCanvasLabels = {
  title: "Klik atau tarik file ke sini",
  hint: "PDF atau gambar, maks. 10 MB",
  active: "Lepas buat unggah",
  replace: "Ganti",
  remove: "Hapus",
}
