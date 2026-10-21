import { calculateBusinessDays } from "@/shared/lib/date"

/**
 * Leave policy and the one balance calculation every screen uses (employee
 * stats, request form, admin "Saldo Cuti"), so they can't disagree.
 */
export const ANNUAL_LEAVE_QUOTA = 12
/** Annual leave must be requested at least this many days before it starts. */
export const ANNUAL_LEAVE_MIN_NOTICE_DAYS = 7
/** Longest single annual-leave request, in business days. */
export const ANNUAL_LEAVE_MAX_DAYS = 5

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  "Annual Leave": "Cuti Tahunan",
  "Sick Leave": "Sakit",
  WFH: "WFH",
  "Work From Home": "WFH",
}

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
}

type DateRange = { start_date: string; end_date: string }

/** Business days of a request that fall inside `year`. */
export function businessDaysInYear(req: DateRange, year: number) {
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)
  const start = new Date(req.start_date)
  const end = new Date(req.end_date)
  const from = start < yearStart ? yearStart : start
  const to = end > yearEnd ? yearEnd : end
  if (to < from) return 0
  return Math.max(0, calculateBusinessDays(from, to))
}

/**
 * Annual-leave summary for one person: approved "Annual Leave" requests,
 * counted in business days within the year, out of the yearly quota.
 */
export function annualLeaveSummary(
  approvedAnnual: DateRange[],
  year = new Date().getFullYear(),
) {
  const used = approvedAnnual.reduce(
    (total, req) => total + businessDaysInYear(req, year),
    0,
  )
  return {
    quota: ANNUAL_LEAVE_QUOTA,
    used,
    remaining: Math.max(0, ANNUAL_LEAVE_QUOTA - used),
  }
}
