import type { MessageKey } from "@/shared/i18n/messages"
import { calculateBusinessDays } from "@/shared/lib/date"
import { addMonths, differenceInCalendarMonths } from "date-fns"

/**
 * Leave policy and the one balance calculation every screen uses (employee
 * stats, request form, admin "Saldo Cuti"), so they can't disagree.
 */
export const ANNUAL_LEAVE_QUOTA = 12
/** Annual leave must be requested at least this many days before it starts. */
export const ANNUAL_LEAVE_MIN_NOTICE_DAYS = 7
/** Longest single annual-leave request, in business days. */
export const ANNUAL_LEAVE_MAX_DAYS = 5

type LeaveKey = MessageKey<"leave">

/** Stored leave types → "leave" message keys (translate at render). */
export const LEAVE_TYPE_LABEL_KEYS: Record<string, LeaveKey> = {
  "Annual Leave": "typeAnnual",
  "Sick Leave": "typeSick",
  WFH: "typeWfh",
  "Work From Home": "typeWfh",
}

/** Stored leave statuses → "leave" message keys. */
export const LEAVE_STATUS_LABEL_KEYS: Record<string, LeaveKey> = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
}

/** Translated label for a stored leave type (unknown types pass through). */
export function leaveTypeLabel(type: string, t: (key: LeaveKey) => string) {
  const key = LEAVE_TYPE_LABEL_KEYS[type]
  return key ? t(key) : type
}

/** Translated label for a stored leave status. */
export function leaveStatusLabel(status: string, t: (key: LeaveKey) => string) {
  const key = LEAVE_STATUS_LABEL_KEYS[status]
  return key ? t(key) : status
}

/** "{n} hari" / "{n} day(s)" key for a count. */
export function daysKey(n: number) {
  return n === 1 ? ("daysOne" as const) : ("daysOther" as const)
}

/** Months of employment before annual leave can be taken at all. */
export const ANNUAL_LEAVE_ELIGIBLE_AFTER_MONTHS = 6
/** Months of employment after which the full quota applies. */
export const ANNUAL_LEAVE_FULL_AFTER_MONTHS = 12

export type EmploymentInfo = {
  join_date?: string | null
  employment_type?: string | null
}

export type Entitlement = {
  eligible: boolean
  quota: number
  /** Why the quota is what it is (Indonesian, for API errors). */
  note: string | null
  /** Same reason as a "leave" message key + vars, for the UI. */
  noteKey: LeaveKey | null
  noteVars?: Record<string, number>
  /** When the person becomes eligible (if not yet). */
  eligibleFrom: Date | null
}

/**
 * Annual-leave entitlement (company rule, on top of UU 13/2003 Pasal 79 as
 * amended by UU 6/2023: 12 days after 12 months):
 * - magang: no annual leave
 * - < 6 months: not eligible yet
 * - 6-11 months: 1 day per full month worked
 * - >= 12 months, or no join date recorded: the full 12 days
 */
export function annualLeaveEntitlement(
  info: EmploymentInfo,
  today = new Date(),
): Entitlement {
  if (info.employment_type === "magang") {
    return {
      eligible: false,
      quota: 0,
      note: "Magang tidak mendapat cuti tahunan",
      noteKey: "noteIntern",
      eligibleFrom: null,
    }
  }
  if (!info.join_date) {
    return {
      eligible: true,
      quota: ANNUAL_LEAVE_QUOTA,
      note: null,
      noteKey: null,
      eligibleFrom: null,
    }
  }
  const joined = new Date(info.join_date)
  let months = differenceInCalendarMonths(today, joined)
  if (today.getDate() < joined.getDate()) months -= 1 // full months only
  months = Math.max(0, months)

  if (months < ANNUAL_LEAVE_ELIGIBLE_AFTER_MONTHS) {
    return {
      eligible: false,
      quota: 0,
      note: `Belum ${ANNUAL_LEAVE_ELIGIBLE_AFTER_MONTHS} bulan bekerja`,
      noteKey: "noteNotYetEligible",
      noteVars: { months: ANNUAL_LEAVE_ELIGIBLE_AFTER_MONTHS },
      eligibleFrom: addMonths(joined, ANNUAL_LEAVE_ELIGIBLE_AFTER_MONTHS),
    }
  }
  if (months < ANNUAL_LEAVE_FULL_AFTER_MONTHS) {
    return {
      eligible: true,
      quota: months,
      note: `${months} bulan bekerja: 1 hari per bulan`,
      noteKey: "noteProrated",
      noteVars: { months },
      eligibleFrom: null,
    }
  }
  return {
    eligible: true,
    quota: ANNUAL_LEAVE_QUOTA,
    note: null,
    noteKey: null,
    eligibleFrom: null,
  }
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
 * counted in business days within the year, out of their entitlement.
 */
export function annualLeaveSummary(
  approvedAnnual: DateRange[],
  year = new Date().getFullYear(),
  employment: EmploymentInfo = {},
) {
  const entitlement = annualLeaveEntitlement(employment)
  const used = approvedAnnual.reduce(
    (total, req) => total + businessDaysInYear(req, year),
    0,
  )
  return {
    ...entitlement,
    used,
    remaining: Math.max(0, entitlement.quota - used),
  }
}
