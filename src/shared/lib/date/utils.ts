import { addDays, differenceInBusinessDays } from "date-fns"

// Hitung selisih hari kerja (Business Days)
export function calculateBusinessDays(start: Date, end: Date): number {
    // differenceInBusinessDays itu eksklusif (start dihitung, end nggak), jadi perlu adjustment dikit
    // Kita tambah 1 hari di akhir biar inklusif
    if (start > end) return 0

    const days = differenceInBusinessDays(addDays(end, 1), start)
    return days
}