import {
  defaultTermsNote,
  type AgencyProfile,
  type ClientSnapshot,
  type InvoiceLine,
  type InvoiceStatus,
  type PaymentSnapshot,
  type ScheduleItem,
} from "@/entities/finance/lib/invoice"
import type { Database } from "@/shared/types/database.types"
import type { InvoiceDocumentData } from "./InvoiceDocument"

type InvoiceRow = Database["public"]["Tables"]["project_invoices"]["Row"]

/** The fields of a `clients` row an invoice prints. */
export type LinkedClient = {
  name: string
  email: string | null
  address: string | null
  country: string | null
  contact_name: string | null
}

/**
 * The client an invoice shows: the project's linked client (one source:
 * `clients`), else what the invoice stored when it was made.
 */
export function invoiceClient(
  linked: LinkedClient | null | undefined,
  stored: unknown,
): ClientSnapshot | null {
  if (linked)
    return {
      name: linked.name,
      email: linked.email,
      address: linked.address ?? linked.country,
      contact: linked.contact_name,
    }
  return (stored as ClientSnapshot | null) ?? null
}

/** A saved invoice, as the document (preview, thumbnail, PDF) draws it. */
export function invoiceDocData(
  invoice: InvoiceRow,
  {
    agency,
    client,
    qrUrl,
  }: {
    agency: AgencyProfile
    client: ClientSnapshot | null
    qrUrl?: string | null
  },
): InvoiceDocumentData {
  const schedule = (invoice.payment_schedule ?? []) as unknown as ScheduleItem[]
  return {
    number: invoice.invoice_number,
    issueDate: invoice.issue_date,
    dueDate: invoice.due_date,
    status: invoice.status as InvoiceStatus,
    currency: invoice.currency ?? "IDR",
    agency,
    client,
    lines: (invoice.line_items as unknown as InvoiceLine[]) ?? [],
    schedule,
    termsNote: invoice.terms_note ?? defaultTermsNote(schedule),
    payment: (invoice.payment_snapshot ?? null) as PaymentSnapshot | null,
    qrUrl,
  }
}

/** "INV-KR-2610-001 - Milxa": the PDF's file name. */
export const invoiceFileName = (data: InvoiceDocumentData) =>
  [data.number, data.client?.name].filter(Boolean).join(" - ")
