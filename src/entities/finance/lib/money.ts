import {
  addMonths,
  addYears,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  endOfYear,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  startOfYear,
} from "date-fns"
import { DEFAULT_LOCALE, type Locale } from "@/shared/i18n/config"
import type { MessageKey } from "@/shared/i18n/messages"
import { finance } from "@/shared/i18n/messages/finance"

export const SUBSCRIPTION_CATEGORIES = [
  "Software",
  "Gaji",
  "Sewa",
  "Layanan",
  "Asuransi",
  "Marketing",
  "Lainnya",
] as const

/** Stored category values stay Indonesian; only the label is translated. */
const CATEGORY_KEYS: Record<string, MessageKey<"finance">> = {
  Software: "catSoftware",
  Gaji: "catSalary",
  Sewa: "catRent",
  Layanan: "catServices",
  Asuransi: "catInsurance",
  Marketing: "catMarketing",
  Lainnya: "catOther",
}

/** Display label for a category; custom categories show as written. */
export function categoryLabel(
  t: (key: MessageKey<"finance">) => string,
  category: string,
) {
  const key = CATEGORY_KEYS[category]
  return key ? t(key) : category
}

/** Donut / legend colours per category (oklch.fyi step 9). */
export const CATEGORY_COLORS: Record<string, string> = {
  Software: "var(--color-teal-9)",
  Gaji: "var(--color-blue-9)",
  Sewa: "var(--color-purple-9)",
  Layanan: "var(--color-amber-9)",
  Asuransi: "var(--color-red-9)",
  Marketing: "var(--color-green-9)",
  Lainnya: "var(--color-pink-9)",
}

export function categoryColor(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Lainnya
}

/** Currencies we bill or pay in. IDR is home: every report totals in IDR. */
export const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "AUD", "GBP"] as const
export type Currency = (typeof CURRENCIES)[number] | string

/** IDR paid/received per 1 unit, markup included. */
export type FxRates = Record<string, number>

/** An amount in its own currency: Rp 750.000, US$15,00, €12,50. */
export function money(amount: number | null | undefined, currency: Currency) {
  const value = Number(amount) || 0
  if (currency === "IDR") return rupiah(value)
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value)
  } catch {
    return `${currency} ${value.toLocaleString("id-ID")}`
  }
}

/**
 * IDR value of an amount: IDR as is; otherwise the item's own rate, then the
 * default rate. Null when no rate is known (shown as "kurs belum diatur").
 */
export function toIdr(
  amount: number | null | undefined,
  currency: Currency,
  fxRate: number | null | undefined,
  rates: FxRates,
) {
  const value = Number(amount) || 0
  if (currency === "IDR") return value
  const rate = fxRate ?? rates[currency]
  return rate ? value * rate : null
}

export const rateOf = (
  currency: Currency,
  fxRate: number | null | undefined,
  rates: FxRates,
) => (currency === "IDR" ? 1 : (fxRate ?? rates[currency] ?? null))

const rupiahFormat = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

export const rupiah = (value: number | null | undefined) =>
  rupiahFormat.format(Number(value) || 0)

/**
 * Short form for tight spots: Rp 2,6 jt, Rp 750 rb, Rp 1,2 M
 * (English units: K, M, B).
 */
export function rupiahShort(value: number, locale: Locale = DEFAULT_LOCALE) {
  const units = finance[locale] ?? finance.id
  const abs = Math.abs(value)
  const fmt = (n: number, unit: string) =>
    `Rp ${n.toLocaleString("id-ID", { maximumFractionDigits: 1 })} ${unit}`
  if (abs >= 1e9) return fmt(value / 1e9, units.unitBillion)
  if (abs >= 1e6) return fmt(value / 1e6, units.unitMillion)
  if (abs >= 1e3) return fmt(value / 1e3, units.unitThousand)
  return rupiah(value)
}

export type Subscription = {
  id: string
  name: string
  category: string
  /** In `currency` units (legacy column name). */
  amount_idr: number
  currency: Currency
  fx_rate: number | null
  cycle: "monthly" | "yearly"
  anchor_date: string
  ends_on: string | null
  notes: string | null
}

const day = (value: string) => startOfDay(parseISO(value))

/** The nth charge date (0 = anchor); month ends clamp (31 Jan → 28 Feb). */
function chargeAt(sub: Subscription, n: number) {
  const anchor = day(sub.anchor_date)
  return sub.cycle === "yearly" ? addYears(anchor, n) : addMonths(anchor, n)
}

/** Every charge date in [from, to], inclusive, honouring the end date. */
export function chargesBetween(sub: Subscription, from: Date, to: Date) {
  const anchor = day(sub.anchor_date)
  const end = sub.ends_on ? day(sub.ends_on) : null
  const last = end && isBefore(end, to) ? end : to
  if (isAfter(anchor, last)) return []
  const step =
    sub.cycle === "yearly"
      ? differenceInCalendarYears(from, anchor)
      : differenceInCalendarMonths(from, anchor)
  const out: Date[] = []
  for (let n = Math.max(0, step - 1); ; n++) {
    const d = chargeAt(sub, n)
    if (isAfter(d, last)) break
    if (!isBefore(d, from)) out.push(d)
    if (out.length > 400) break
  }
  return out
}

export function nextCharge(sub: Subscription, today = startOfDay(new Date())) {
  return (
    chargesBetween(sub, today, addYears(today, 2)).find(
      (d) => !isBefore(d, today),
    ) ?? null
  )
}

export function isActive(sub: Subscription, today = startOfDay(new Date())) {
  return !sub.ends_on || !isBefore(day(sub.ends_on), today)
}

/** One charge in IDR (0 when the currency has no rate yet). */
export const chargeIdr = (sub: Subscription, rates: FxRates) =>
  toIdr(sub.amount_idr, sub.currency, sub.fx_rate, rates) ?? 0

/** What it costs per month in IDR on average (yearly / 12). */
export const monthly = (sub: Subscription, rates: FxRates) =>
  sub.cycle === "yearly" ? chargeIdr(sub, rates) / 12 : chargeIdr(sub, rates)

export const missingRate = (
  item: { currency: Currency; fx_rate: number | null },
  rates: FxRates,
) => item.currency !== "IDR" && !item.fx_rate && !rates[item.currency]

export function yearRange(year: number) {
  const start = startOfYear(new Date(year, 0, 1))
  return { start, end: endOfYear(start) }
}

export type InvoiceLite = {
  id: string
  invoice_number: string
  status: string
  issue_date: string
  due_date: string
  /** In `currency` units (legacy column names). */
  amount_idr: number
  amount_paid_idr: number
  currency: Currency
  fx_rate: number | null
  project: { id: string; name: string; client_name: string | null } | null
}

export const OPEN_STATUSES = ["Sent", "Partial", "Overdue"]
/** Still owed, in the invoice's own currency. */
export const leftToPay = (inv: InvoiceLite) =>
  Math.max(0, Number(inv.amount_idr) - Number(inv.amount_paid_idr))

export const receivedIdr = (inv: InvoiceLite, rates: FxRates) =>
  toIdr(inv.amount_paid_idr, inv.currency, inv.fx_rate, rates) ?? 0

export const openIdr = (inv: InvoiceLite, rates: FxRates) =>
  toIdr(leftToPay(inv), inv.currency, inv.fx_rate, rates) ?? 0
