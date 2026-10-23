/**
 * The Kretya invoice (Figma "Template Invoice"): line items with a timeline,
 * a payment schedule (full / down payment / milestones), and one payment
 * method printed in the footer. Pure helpers shared by the editor, the
 * preview and the print page.
 */

export type PaymentType =
  | "bank"
  | "crypto"
  | "paypal"
  | "payoneer"
  | "stripe"
  | "wise"
  | "cash"
  | "other"

export const PAYMENT_TYPES: PaymentType[] = [
  "bank",
  "crypto",
  "paypal",
  "payoneer",
  "wise",
  "stripe",
  "other",
]

/** Label printed after "Payment Method:" in the header chip. */
export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  bank: "Bank Transfer",
  crypto: "Crypto",
  paypal: "PayPal",
  payoneer: "Payoneer",
  stripe: "Stripe",
  wise: "Wise",
  cash: "Cash",
  other: "Other",
}

/** Fields each payment type prints, in order (key → English label). */
export const PAYMENT_FIELDS: Record<
  PaymentType,
  { key: string; label: string }[]
> = {
  bank: [
    { key: "account_name", label: "Account Name" },
    { key: "bank_name", label: "Bank Name" },
    { key: "account_number", label: "Account Number" },
    { key: "swift", label: "SWIFT Code" },
    { key: "bank_address", label: "Bank Address" },
  ],
  crypto: [
    { key: "asset", label: "Payment Method" },
    { key: "asset_name", label: "Asset" },
    { key: "network", label: "Network" },
    { key: "network_code", label: "Network Code" },
    { key: "address", label: "Address" },
  ],
  paypal: [
    { key: "email", label: "PayPal Email" },
    { key: "username", label: "PayPal Username" },
    { key: "account_name", label: "Account Name" },
  ],
  payoneer: [
    { key: "email", label: "Payoneer Email" },
    { key: "account_name", label: "Account Name" },
    { key: "account_type", label: "Account Type" },
  ],
  wise: [
    { key: "email", label: "Wise Email" },
    { key: "account_name", label: "Account Name" },
    { key: "account_number", label: "Account Number" },
  ],
  stripe: [{ key: "link", label: "Payment Link" }],
  cash: [],
  other: [{ key: "details", label: "Details" }],
}

/** Footer section title per type ("Crypto Asset", "Bank Transfer"…). */
export const PAYMENT_SECTION_TITLE: Record<PaymentType, string> = {
  ...PAYMENT_TYPE_LABEL,
  crypto: "Crypto Asset",
}

/** "Please Note" lines a new method starts with (from the template). */
export function defaultNotes(
  type: PaymentType,
  details: Record<string, string> = {},
) {
  const asset = details.asset || "USDT"
  const network = details.network_code || details.network || "TRC-20"
  switch (type) {
    case "crypto":
      return [
        `ONLY send ${asset} via ${network} network`,
        "Do NOT use other networks",
        "Double check network before sending",
        "Confirm the address with us before a large transfer",
        "No memo/tag required",
      ].join("\n")
    case "bank":
      return "Please match the invoice total\nInclude invoice number in transfer notes"
    case "paypal":
      return [
        'Send payment as "Friends & Family" to avoid fees (if trusted transaction)',
        'OR send as "Goods & Services" and add 3-5% for fees',
        "Include invoice number in payment note/message",
      ].join("\n")
    case "payoneer":
    case "wise":
      return "Include invoice number in payment note/message"
    default:
      return ""
  }
}

/** Crypto addresses older than this get a "check it again" warning. */
export const VERIFY_AFTER_DAYS = 7

export function needsVerification(
  method: { type: string; verified_at: string | null } | null | undefined,
  now = new Date(),
) {
  if (!method || method.type !== "crypto") return false
  if (!method.verified_at) return true
  const days =
    (now.getTime() - new Date(method.verified_at).getTime()) / 86_400_000
  return days > VERIFY_AFTER_DAYS
}

// --- Line items & schedule ---------------------------------------------------

/** Stored in `line_items`; quantity/unit kept for the old shape. */
export type InvoiceLine = {
  id: string
  description: string
  /** e.g. "1 month", "2 weeks". */
  timeline: string
  quantity: number
  unit_price_idr: number
  total_idr: number
}

export type ScheduleStatus = "unpaid" | "pending" | "paid"

export type ScheduleItem = {
  id: string
  label: string
  percent: number
  status: ScheduleStatus
  paid_at?: string | null
}

export type SchedulePreset = "full" | "dp" | "milestone"

const uid = () => crypto.randomUUID()

export function schedulePreset(preset: SchedulePreset): ScheduleItem[] {
  if (preset === "full")
    return [
      { id: uid(), label: "Full Payment", percent: 100, status: "unpaid" },
    ]
  if (preset === "dp")
    return [
      { id: uid(), label: "Down Payment", percent: 50, status: "unpaid" },
      { id: uid(), label: "Final Payment", percent: 50, status: "pending" },
    ]
  return [
    { id: uid(), label: "Milestone 1", percent: 30, status: "unpaid" },
    { id: uid(), label: "Milestone 2", percent: 30, status: "pending" },
    { id: uid(), label: "Milestone 3", percent: 40, status: "pending" },
  ]
}

/** Which preset a schedule looks like (for the segmented control). */
export function presetOf(schedule: ScheduleItem[]): SchedulePreset {
  if (schedule.length <= 1) return "full"
  if (schedule.length === 2 && /down/i.test(schedule[0].label)) return "dp"
  return "milestone"
}

/** Title above the schedule rows, as on the template. */
export function scheduleTitle(schedule: ScheduleItem[]) {
  const preset = presetOf(schedule)
  return preset === "full"
    ? "Payment"
    : preset === "dp"
      ? "Payment Breakdown"
      : "Milestone Breakdown"
}

export function defaultTermsNote(schedule: ScheduleItem[]) {
  return presetOf(schedule) === "full"
    ? "Payment due in full to start project."
    : "Down payment required to start."
}

export const lineTotal = (line: Pick<InvoiceLine, "total_idr">) =>
  Number(line.total_idr) || 0

export function invoiceTotals(lines: InvoiceLine[], schedule: ScheduleItem[]) {
  const total = lines.reduce((sum, l) => sum + lineTotal(l), 0)
  const share = (item: ScheduleItem) =>
    Math.round(((total * (Number(item.percent) || 0)) / 100) * 100) / 100
  const paid = schedule
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + share(s), 0)
  const percentSum = schedule.reduce(
    (sum, s) => sum + (Number(s.percent) || 0),
    0,
  )
  return {
    total,
    paid,
    balance: Math.max(0, total - paid),
    share,
    percentSum,
  }
}

// --- Status ------------------------------------------------------------------

export type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Partial"
  | "Paid"
  | "Overdue"
  | "Refunded"

/**
 * Status from the schedule: Draft and Refunded are chosen by hand; otherwise
 * all terms paid → Paid, some → Partial, none → Sent (Overdue once past due).
 */
export function deriveStatus(
  chosen: InvoiceStatus,
  schedule: ScheduleItem[],
  dueDate: string | null,
  today = new Date(),
): InvoiceStatus {
  if (chosen === "Draft" || chosen === "Refunded") return chosen
  if (schedule.length && schedule.every((s) => s.status === "paid"))
    return "Paid"
  if (schedule.some((s) => s.status === "paid")) return "Partial"
  if (dueDate && new Date(`${dueDate}T23:59:59`) < today) return "Overdue"
  return "Sent"
}

/** The chip on the printed invoice ("Status: PARTIALLY PAID"). */
export const PRINT_STATUS: Record<
  InvoiceStatus,
  { label: string; tone: "info" | "warning" | "success" | "danger" | "muted" }
> = {
  Draft: { label: "DRAFT", tone: "muted" },
  Sent: { label: "UNPAID", tone: "info" },
  Overdue: { label: "UNPAID", tone: "info" },
  Partial: { label: "PARTIALLY PAID", tone: "warning" },
  Paid: { label: "PAID", tone: "success" },
  Refunded: { label: "REFUNDED", tone: "danger" },
}

export const SCHEDULE_LABEL: Record<ScheduleStatus, string> = {
  unpaid: "Not Paid",
  pending: "Pending",
  paid: "Paid",
}

// --- Numbering & agency --------------------------------------------------------

/** "INV-KR-2610-003": year+month of the invoice date, then a running number. */
export function nextInvoiceNumber(existing: string[], date = new Date()) {
  const yymm = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, "0")}`
  const prefix = `INV-KR-${yymm}-`
  const used = existing
    .filter((n) => n?.startsWith(prefix))
    .map((n) => Number(n.slice(prefix.length)) || 0)
  return `${prefix}${String(Math.max(0, ...used) + 1).padStart(3, "0")}`
}

export type AgencyProfile = {
  name: string
  tagline: string
  email: string
  address: string
}

export const AGENCY_SETTING_KEY = "invoice_agency"

export const DEFAULT_AGENCY: AgencyProfile = {
  name: "Kretya Studio",
  tagline: "UI/UX Creative Agency",
  email: "kretyastudio@gmail.com",
  address:
    "Cluster Greenwood Blok P No. 22, 17121, Golden City, Teluk Pucung, Bekasi Utara, Indonesia",
}

export type ClientSnapshot = {
  name: string
  email: string | null
  address: string | null
  contact: string | null
}

export type PaymentSnapshot = {
  id: string | null
  name: string
  type: PaymentType
  details: Record<string, string>
  notes: string | null
  qr_path: string | null
  verified_at: string | null
}
