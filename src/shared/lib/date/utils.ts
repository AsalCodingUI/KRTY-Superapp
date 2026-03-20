import { addDays, differenceInBusinessDays, startOfDay } from "date-fns"

// Hitung selisih hari kerja (Business Days)
export function calculateBusinessDays(start: Date, end: Date): number {
  // differenceInBusinessDays itu eksklusif (start dihitung, end nggak), jadi perlu adjustment dikit
  // Kita tambah 1 hari di akhir biar inklusif
  const normalizedStart = startOfDay(start)
  const normalizedEnd = startOfDay(end)
  if (normalizedStart > normalizedEnd) return 0

  const days = differenceInBusinessDays(
    addDays(normalizedEnd, 1),
    normalizedStart,
  )
  return days
}
