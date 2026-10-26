import { cn } from "@/lib/utils"
import { money } from "@/entities/finance/lib/money"
import {
  invoiceTotals,
  PAYMENT_FIELDS,
  PAYMENT_SECTION_TITLE,
  PAYMENT_TYPE_LABEL,
  PRINT_STATUS,
  SCHEDULE_LABEL,
  scheduleTitle,
  type AgencyProfile,
  type ClientSnapshot,
  type InvoiceLine,
  type InvoiceStatus,
  type PaymentSnapshot,
  type ScheduleItem,
} from "@/entities/finance/lib/invoice"

export type InvoiceDocumentData = {
  number: string
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  currency: string
  agency: AgencyProfile
  client: ClientSnapshot | null
  lines: InvoiceLine[]
  schedule: ScheduleItem[]
  termsNote: string
  payment: PaymentSnapshot | null
  /** Signed URL of the payment method's QR image. */
  qrUrl?: string | null
}

/** Design width of the template (A4 at this width is 1103 × 1561). */
export const INVOICE_WIDTH = 1103
export const INVOICE_HEIGHT = 1561

const STATUS_TONE = {
  info: "bg-[#0A3E85] text-white",
  warning: "bg-[#8A4A0B] text-white",
  success: "bg-[#13693A] text-white",
  danger: "bg-[#7A1036] text-white",
  muted: "bg-[#2A2A2A] text-white/80",
} as const

const TERM_TONE = {
  unpaid: "bg-[#FFE3E1] text-[#C8102E]",
  pending: "bg-[#FFF3CC] text-[#8A5A00]",
  paid: "bg-[#E3F9E3] text-[#13843A]",
} as const

/** The Kretya mark from the template (Figma "Logo Background", 94 × 24). */
function KretyaLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/kretya-logo.svg"
      alt="Kretya"
      width={94}
      height={24}
      className="block shrink-0"
    />
  )
}

/** Placeholder text the template shows in brackets, grey. */
function Blank({ children }: { children: React.ReactNode }) {
  return <span className="text-[#8C8C8C]">{children}</span>
}

function HeaderChip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "rounded-[2px] bg-[#1F1F1F] px-2.5 py-1 text-[14px] leading-5 whitespace-nowrap text-white",
        className,
      )}
    >
      {children}
    </span>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-fit rounded-[2px] bg-[#2B2B2B] px-2.5 py-1 text-[12px] leading-4 text-white/85">
      {children}
    </span>
  )
}

function CurrencyChip({ code }: { code: string }) {
  return (
    <span className="rounded-[2px] bg-[#ECECEC] px-2 py-0.5 text-[15px] leading-6 text-[#2B2B2B]">
      {code}
    </span>
  )
}

/** Client-facing amounts: "Rp 5.000.000" for IDR, "$1,500" otherwise. */
const amount = (value: number, currency: string) => {
  if (currency === "IDR") return money(value, "IDR").replace(/\u00a0/g, " ")
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(Number(value) || 0)
  } catch {
    return `${currency} ${value}`
  }
}

/**
 * The printed Kretya invoice, drawn at its design size (1103px wide). Scale it
 * to fit with CSS transform (preview) or print zoom; never reflow it.
 */
export function InvoiceDocument({ data }: { data: InvoiceDocumentData }) {
  const { total, paid, balance, share } = invoiceTotals(
    data.lines,
    data.schedule,
  )
  const status = PRINT_STATUS[data.status]
  const payment = data.payment
  const fields = payment ? PAYMENT_FIELDS[payment.type] : []
  const notes = (payment?.notes ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  return (
    <article
      className="flex flex-col bg-white font-sans text-[#141414] antialiased"
      style={{ width: INVOICE_WIDTH, minHeight: INVOICE_HEIGHT }}
    >
      {/* Header ------------------------------------------------------------ */}
      <header className="relative bg-black px-[60px] pt-[34px] pb-[34px] text-white">
        <div className="absolute top-[31px] right-[60px] flex items-center gap-3">
          <KretyaLogo />
          <HeaderChip>Invoice</HeaderChip>
        </div>
        <h1 className="text-[48px] leading-[56px] font-normal tracking-tight">
          Invoice
        </h1>
        <p className="max-w-[760px] truncate text-[48px] leading-[56px] tracking-tight text-[#8C8C8C]">
          {data.client?.name || "[company name]"}
        </p>
        <div className="mt-[14px] flex flex-wrap items-center gap-2">
          <HeaderChip className="text-[13px]">
            {data.number || "INV-KR-YYMM-00X"}
          </HeaderChip>
          <span className="mx-0.5 h-5 w-px bg-white/20" />
          <HeaderChip>
            Invoice Date: {data.issueDate || "YYYY-MM-DD"}
          </HeaderChip>
          <HeaderChip>Due Date: {data.dueDate || "YYYY-MM-DD"}</HeaderChip>
          {payment && (
            <HeaderChip>
              Payment Method: {PAYMENT_TYPE_LABEL[payment.type] ?? payment.name}
            </HeaderChip>
          )}
          <HeaderChip className={STATUS_TONE[status.tone]}>
            Status: {status.label}
          </HeaderChip>
        </div>
      </header>

      {/* From / to / concerned ---------------------------------------------- */}
      <section className="grid grid-cols-[410px_410px_1fr] bg-[#1A1A1A] text-white">
        <div className="flex flex-col gap-1 border-r border-[#2C2C2C] px-[60px] py-8">
          <Label>{data.agency.tagline.toUpperCase()}</Label>
          <p className="mt-3 text-[20px] leading-7">{data.agency.name}</p>
          <p className="text-[14px] text-white/80">{data.agency.email}</p>
          <p className="mt-5 text-[14px] leading-[21px] text-white/90">
            {data.agency.address}
          </p>
        </div>
        <div className="flex flex-col gap-1 border-r border-[#2C2C2C] px-8 py-8">
          <Label>CLIENT</Label>
          <p className="mt-3 truncate text-[20px] leading-7">
            {data.client?.name || <Blank>[company name]</Blank>}
          </p>
          <p className="truncate text-[14px] text-white/80">
            {data.client?.email || <Blank>[email client]</Blank>}
          </p>
          <p className="mt-5 text-[14px] leading-[21px] whitespace-pre-line text-white/90">
            {data.client?.address || ""}
          </p>
        </div>
        <div className="flex flex-col px-8 py-8">
          <Label>Concerned</Label>
          <div className="mt-auto text-[14px] leading-[21px] text-white/90">
            <p>{data.client?.contact || <Blank>[name client]</Blank>}</p>
            <p>{data.agency.name}</p>
          </div>
        </div>
      </section>

      {/* Items ---------------------------------------------------------------- */}
      <section className="px-[60px] pt-10">
        <div className="grid grid-cols-[50px_minmax(0,1fr)_120px_190px] items-center border-b border-[#E5E5E5] px-3 pb-3 text-[16px]">
          <span>No</span>
          <span>Point Description</span>
          <span>Timeline</span>
          <span>Price</span>
        </div>
        {data.lines.length === 0 && (
          <div className="grid grid-cols-[50px_minmax(0,1fr)_120px_190px] border-b border-[#E5E5E5] px-3 py-2 text-[16px]">
            <span>1.</span>
            <Blank>Point description</Blank>
          </div>
        )}
        {data.lines.map((line, i) => (
          <div
            key={line.id}
            className="grid grid-cols-[50px_minmax(0,1fr)_120px_190px] items-center border-b border-[#E5E5E5] px-3 py-1.5 text-[16px] last:border-b-0"
          >
            <span>{i + 1}.</span>
            <span className="pr-4 [overflow-wrap:anywhere]">
              {line.description || <Blank>—</Blank>}
            </span>
            <span className="pr-2 [overflow-wrap:anywhere]">
              {line.timeline}
            </span>
            <span className="flex items-center justify-between gap-2 whitespace-nowrap">
              {amount(line.total_idr, data.currency)}
              <CurrencyChip code={data.currency} />
            </span>
          </div>
        ))}
      </section>

      <div className="min-h-10 flex-1" />

      {/* Totals --------------------------------------------------------------- */}
      <section className="ml-auto w-[560px] pr-[60px] pb-8 text-[16px]">
        <div className="flex items-center justify-between bg-[#F4F4F4] py-1.5 pr-1.5 pl-3">
          <span>Grand Total</span>
          <span className="flex items-center gap-8 whitespace-nowrap">
            {amount(total, data.currency)}
            <CurrencyChip code={data.currency} />
          </span>
        </div>

        {data.schedule.length > 0 && (
          <div className="mt-8">
            <p className="border-b border-[#E5E5E5] px-3 pb-2 text-[#8C8C8C]">
              {scheduleTitle(data.schedule)}
            </p>
            {data.schedule.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_auto_190px] items-center gap-3 border-b border-[#E5E5E5] py-1.5 pr-1.5 pl-3 last:border-b-0"
              >
                <span className="flex items-center gap-2">
                  {item.label}
                  <span className="rounded-[2px] border border-[#E5E5E5] px-2 text-[15px]">
                    {Number(item.percent) || 0}%
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-[2px] px-2 text-[15px] leading-6",
                    TERM_TONE[item.status],
                  )}
                >
                  {SCHEDULE_LABEL[item.status]}
                </span>
                <span className="flex items-center justify-between gap-2 whitespace-nowrap">
                  {amount(share(item), data.currency)}
                  <CurrencyChip code={data.currency} />
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 border-t border-[#E5E5E5]">
          <div className="flex items-center justify-between py-1.5 pr-1.5 pl-3">
            <span>Amount Paid</span>
            <span className="flex items-center gap-8 whitespace-nowrap">
              {amount(paid, data.currency)}
              <CurrencyChip code={data.currency} />
            </span>
          </div>
          <div className="flex items-center justify-between bg-[#F4F4F4] py-1.5 pr-1.5 pl-3">
            <span>Balance Due</span>
            <span className="flex items-center gap-8 whitespace-nowrap">
              {amount(data.status === "Refunded" ? 0 : balance, data.currency)}
              <CurrencyChip code={data.currency} />
            </span>
          </div>
        </div>
        {data.termsNote && (
          <p className="mt-2 text-center text-[14px]">{data.termsNote}</p>
        )}
        <p className="mt-2 bg-black py-1 text-center text-[14px] text-white">
          Please pay this amount with the payment information above.
        </p>
      </section>

      {/* Payment method ------------------------------------------------------- */}
      {payment && (
        <footer className="grid grid-cols-[1fr_327px] border-t border-[#E5E5E5]">
          <div className="flex gap-6 px-8 py-8">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <p className="text-[16px]">
                {PAYMENT_SECTION_TITLE[payment.type] ?? payment.name}
              </p>
              <dl className="grid grid-cols-[134px_1fr] gap-x-3 gap-y-1 text-[12px] leading-[18px]">
                {fields.map((f) => {
                  const value = payment.details[f.key]
                  if (payment.type === "crypto" && f.key === "asset_name")
                    return null
                  if (payment.type === "crypto" && f.key === "network_code")
                    return null
                  return (
                    <div key={f.key} className="contents">
                      <dt className="text-[#5C5C5C]">{f.label}</dt>
                      <dd className="min-w-0 break-words">
                        {payment.type === "crypto" && f.key === "asset" ? (
                          <span className="flex items-center gap-1.5">
                            {value || "—"}
                            {payment.details.asset_name && (
                              <span className="rounded-[2px] bg-[#E3F9E3] px-1.5 text-[#13843A]">
                                {payment.details.asset_name}
                              </span>
                            )}
                          </span>
                        ) : payment.type === "crypto" && f.key === "network" ? (
                          <span className="flex items-center gap-1.5">
                            {value || "—"}
                            {payment.details.network_code && (
                              <span className="rounded-[2px] bg-[#ECECEC] px-1.5">
                                ({payment.details.network_code})
                              </span>
                            )}
                            <span className="rounded-[2px] bg-[#FFE9A8] px-1.5 text-[#8A5A00]">
                              IMPORTANT!
                            </span>
                          </span>
                        ) : payment.type === "crypto" && f.key === "address" ? (
                          <span className="font-mono text-[11px] break-all">
                            {value || "-"}
                          </span>
                        ) : (
                          value || "-"
                        )}
                      </dd>
                    </div>
                  )
                })}
                {payment.type === "crypto" && (
                  <div className="contents">
                    <dt className="text-[#5C5C5C]">Recommended</dt>
                    <dd>
                      We strongly advise sending a small test transaction{" "}
                      <span className="rounded-[2px] bg-[#FFE3E1] px-1 text-[#C8102E]">
                        ($1-5)
                      </span>{" "}
                      prior to transferring the full payment amount to ensure
                      the address and network are configured correctly.
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            {payment.type === "crypto" && (
              <div className="grid size-[106px] shrink-0 place-items-center border border-[#E5E5E5] bg-white">
                {data.qrUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- signed, private URL
                  <img
                    src={data.qrUrl}
                    alt="QR"
                    className="size-full object-contain p-1"
                  />
                )}
              </div>
            )}
          </div>
          <div className="border-l border-[#E5E5E5] px-8 py-8">
            <p className="text-[16px]">Please Note</p>
            {payment.type === "bank" ? (
              <dl className="mt-4 flex flex-col gap-3 text-[12px] leading-[18px]">
                {notes.map((line, i) => (
                  <div key={i}>
                    <dt className="text-[#5C5C5C]">
                      {i === 0 ? "Transfer amount" : "Reference"}
                    </dt>
                    <dd>{line}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <ul className="mt-4 flex list-disc flex-col gap-1 pl-4 text-[12px] leading-[18px]">
                {notes.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        </footer>
      )}
    </article>
  )
}
