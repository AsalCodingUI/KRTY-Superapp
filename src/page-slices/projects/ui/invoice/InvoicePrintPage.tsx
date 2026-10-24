"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  defaultTermsNote,
  type ClientSnapshot,
  type InvoiceLine,
  type InvoiceStatus,
  type PaymentSnapshot,
  type ScheduleItem,
} from "@/entities/finance/lib/invoice"
import { createClient } from "@/shared/api/supabase/client"
import { useT } from "@/shared/i18n/client"
import { useQuery } from "@tanstack/react-query"
import { Printer } from "@/components/icons"
import { useEffect, useRef } from "react"
import { useAgency, useQrUrl } from "./data"
import {
  INVOICE_WIDTH,
  InvoiceDocument,
  type InvoiceDocumentData,
} from "./InvoiceDocument"

/**
 * A4 is 210mm ≈ 793.7 CSS px wide; the template is 1103px. A hair smaller so
 * rounding never pushes the footer onto a second page.
 */
const PRINT_ZOOM = 790 / INVOICE_WIDTH

/**
 * One invoice laid out on an A4 page for "Print → Save as PDF". The page
 * title becomes the PDF's file name, so it carries the number and client.
 */
export function InvoicePrintPage({ id }: { id: string }) {
  const t = useT("invoices")
  const { data: agency } = useAgency()
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice-print", id],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("project_invoices")
        .select(
          "*, projects(name, client:clients!projects_client_id_fkey ( name, email, address, country, contact_name ))",
        )
        .eq("id", id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
  const payment = (invoice?.payment_snapshot ?? null) as PaymentSnapshot | null
  const { data: qrUrl, isFetched: qrFetched } = useQrUrl(
    payment?.type === "crypto" ? payment.qr_path : null,
  )

  // The project's linked client (one source: `clients`); invoices of a
  // project without one keep what they stored.
  const linked = (
    invoice?.projects as {
      client: {
        name: string
        email: string | null
        address: string | null
        country: string | null
        contact_name: string | null
      } | null
    } | null
  )?.client
  const schedule =
    ((invoice?.payment_schedule ?? []) as unknown as ScheduleItem[]) ?? []
  const client: ClientSnapshot | null = linked
    ? {
        name: linked.name,
        email: linked.email,
        address: linked.address ?? linked.country,
        contact: linked.contact_name,
      }
    : ((invoice?.client_snapshot as ClientSnapshot | null) ?? null)

  const data: InvoiceDocumentData | null =
    invoice && agency
      ? {
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
          payment,
          qrUrl,
        }
      : null

  // File name for "Save as PDF".
  useEffect(() => {
    if (!invoice) return
    document.title = [invoice.invoice_number, client?.name]
      .filter(Boolean)
      .join(" - ")
  }, [invoice, client?.name])

  // Open the print dialog once, after the QR (if any) has loaded.
  const printed = useRef(false)
  const ready = Boolean(data)
  const qrReady = payment?.type !== "crypto" || !payment.qr_path || qrFetched
  useEffect(() => {
    if (!ready || !qrReady || printed.current) return
    printed.current = true
    const timer = window.setTimeout(() => window.print(), 600)
    return () => window.clearTimeout(timer)
  }, [ready, qrReady])

  if (isLoading || (invoice && !agency))
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  if (!data)
    return (
      <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
        {t("notFound")}
      </div>
    )

  return (
    <div className="invoice-print-root bg-muted/60 flex min-h-svh flex-col items-center gap-4 py-8">
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .invoice-print-root { background: #fff !important; padding: 0 !important; gap: 0 !important; min-height: 0 !important; display: block !important; }
          .invoice-print-sheet footer, .invoice-print-sheet section { break-inside: avoid; }
          .invoice-print-toolbar { display: none !important; }
          .invoice-print-sheet { box-shadow: none !important; zoom: ${PRINT_ZOOM}; }
          .invoice-print-sheet, .invoice-print-sheet * {
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
        }
      `}</style>
      <div className="invoice-print-toolbar flex items-center gap-3">
        <Button onClick={() => window.print()}>
          <Printer data-icon="inline-start" />
          {t("print")}
        </Button>
        <span className="text-muted-foreground text-sm">{t("printHint")}</span>
      </div>
      <div className="invoice-print-sheet bg-white shadow-(--elev-3)">
        <InvoiceDocument data={data} />
      </div>
    </div>
  )
}
