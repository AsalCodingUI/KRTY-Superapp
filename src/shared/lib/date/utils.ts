import { addDays, differenceInBusinessDays, format, startOfDay } from "date-fns"

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

type AttendanceLogLike = {
  date?: string | null
  clock_in?: string | null
  clock_out?: string | null
}

export function getLocalDateString(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd")
}

export function getAttendanceLogLocalDate(log: AttendanceLogLike): string {
  if (log.clock_in) {
    const clockInDate = new Date(log.clock_in)

    if (!Number.isNaN(clockInDate.getTime())) {
      return getLocalDateString(clockInDate)
    }
  }

  return log.date ?? ""
}

export function getAttendanceSessionState<T extends AttendanceLogLike>(
  logs: T[],
  now: Date = new Date(),
) {
  const today = getLocalDateString(now)
  const openLogs = logs
    .filter((log) => !log.clock_out)
    .sort((a, b) => {
      const aTime = new Date(a.clock_in ?? a.date ?? 0).getTime()
      const bTime = new Date(b.clock_in ?? b.date ?? 0).getTime()

      return bTime - aTime
    })

  const activeSession =
    openLogs.find((log) => getAttendanceLogLocalDate(log) === today) ?? null
  const staleSession =
    openLogs.find((log) => getAttendanceLogLocalDate(log) !== today) ?? null

  return {
    today,
    activeSession,
    staleSession,
    hasOpenSession: openLogs.length > 0,
  }
}
