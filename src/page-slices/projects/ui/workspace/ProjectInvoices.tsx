"use client"

import { money, toIdr } from "@/entities/finance/lib/money"
import { useFxRates } from "@/entities/finance/model/useFxRates"
import { PageHeader } from "@/components/page-header"
import { StatStrip } from "@/components/stat-strip"
import { TabNavigation, TabNavigationLink } from "@/components/tab-navigation"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  deleteInvoice,
  getInvoicesByProject,
} from "@/entities/finance/api/client"
import { cn } from "@/lib/utils"
import { RiAddLine, RiMoneyDollarCircleLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { differenceInCalendarDays, format } from "date-fns"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { MessageKey } from "@/shared/i18n/messages"
import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { InvoiceRecord } from "../invoice/InvoiceEditorDialog"
import { createClient } from "@/shared/api/supabase/client"
import { useViewMode, ViewToggle } from "@/components/view-toggle"
import { nextInvoiceNumber } from "@/entities/finance/lib/invoice"
import { addDays } from "date-fns"
import { useAgency } from "../invoice/data"
import {
  invoiceClient,
  invoiceDocData,
  invoiceFileName,
} from "../invoice/doc-data"
import { InvoiceThumb } from "../invoice/InvoiceThumb"
import { downloadInvoicePdf, signQr } from "../invoice/pdf"
import { useViewer, useWorkspace } from "./data"
import { Chip } from "./FilePreview"
import { RowMenu, type RowMenuItem } from "./ProjectLibrary"

// Form dialog loads on first open.
// The full-screen editor loads on first open.
const InvoiceEditorDialog = dynamic(
  () =>
    import("../invoice/InvoiceEditorDialog").then((m) => m.InvoiceEditorDialog),
  { loading: () => null },
)

type FinanceKey = MessageKey<"finance">

const STATUS: Record<string, { label: FinanceKey; tone: string; dot: string }> =
  {
    Draft: {
      label: "statusDraft",
      tone: "bg-muted text-muted-foreground",
      dot: "bg-white/70",
    },
    Sent: { label: "statusSent", tone: "bg-info/15 text-info", dot: "bg-info" },
    Partial: {
      label: "statusPartial",
      tone: "bg-warning/15 text-warning",
      dot: "bg-warning",
    },
    Paid: {
      label: "statusPaid",
      tone: "bg-success/15 text-success",
      dot: "bg-success",
    },
    Overdue: {
      label: "statusOverdue",
      tone: "bg-destructive/15 text-destructive",
      dot: "bg-destructive",
    },
    Refunded: {
      label: "statusRefunded",
      tone: "bg-muted text-muted-foreground",
      dot: "bg-white/70",
    },
  }

// Invoice · items · due · status · amount · actions (full-bleed, like Tim)
const ROW =
  "gutter-x grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_8rem_7rem_minmax(9rem,12rem)_2rem] items-center gap-x-4"

const FILTERS = [
  { key: "all", label: "filterAll" },
  { key: "Draft", label: "statusDraft" },
  { key: "open", label: "filterUnpaid" },
  { key: "Paid", label: "statusPaid" },
] as const

const rupiah = (value: number | null) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const isOpen = (inv: InvoiceRecord) =>
  ["Sent", "Partial", "Overdue"].includes(inv.status)

/** Project invoices: what came in, what's still open, and every invoice. */
export function ProjectInvoices({ projectId }: { projectId: string }) {
  const t = useT("finance")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const viewer = useViewer()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [formMounted, setFormMounted] = useState(false)
  if (formOpen && !formMounted) setFormMounted(true)
  const [editing, setEditing] = useState<InvoiceRecord | undefined>()
  const [deleting, setDeleting] = useState<InvoiceRecord | null>(null)

  const [view, setView] = useViewMode("project-invoices", "grid")
  const { data: agency } = useAgency()
  const { data: workspace } = useWorkspace(projectId)
  const ti = useT("invoices")

  const { data: invoicesResult, isLoading } = useQuery({
    queryKey: ["invoices", projectId],
    queryFn: () => getInvoicesByProject(projectId),
  })
  const invoices = useMemo<InvoiceRecord[]>(
    () => (invoicesResult?.success ? invoicesResult.data : []),
    [invoicesResult],
  )
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["invoices", projectId] })

  // Amounts are in each invoice's currency; totals convert to IDR.
  const { data: rates } = useFxRates()
  const { received, openAmount, counts } = useMemo(() => {
    const idr = (amount: number, inv: InvoiceRecord) =>
      toIdr(amount, inv.currency ?? "IDR", inv.fx_rate, rates ?? {}) ?? 0
    const open = invoices.filter(isOpen)
    return {
      received: invoices.reduce(
        (sum, inv) => sum + idr(Number(inv.amount_paid_idr) || 0, inv),
        0,
      ),
      openAmount: open.reduce(
        (sum, inv) =>
          sum +
          idr(
            (Number(inv.amount_idr) || 0) - (Number(inv.amount_paid_idr) || 0),
            inv,
          ),
        0,
      ),
      counts: {
        all: invoices.length,
        Draft: invoices.filter((i) => i.status === "Draft").length,
        open: open.length,
        Paid: invoices.filter((i) => i.status === "Paid").length,
      } as Record<string, number>,
    }
  }, [invoices, rates])

  const day = (date: string) =>
    format(new Date(date), "d MMM yyyy", { locale: dateLocale })
  /** "8 days late" / "3 days left" for invoices still waiting on money. */
  const due = (inv: InvoiceRecord) => {
    if (["Paid", "Draft", "Refunded"].includes(inv.status)) return null
    const days = differenceInCalendarDays(new Date(inv.due_date), new Date())
    return {
      tone: days < 0 ? "text-destructive" : "text-success-ink",
      label:
        days < 0
          ? t("lateDays", { n: -days })
          : days === 0
            ? t("dueToday")
            : t("daysLeft", { n: days }),
    }
  }
  const docData = (inv: InvoiceRecord, qrUrl?: string | null) =>
    invoiceDocData(inv, {
      agency: agency ?? {
        name: "Kretya Studio",
        tagline: "",
        email: "",
        address: "",
      },
      client: invoiceClient(workspace?.client, inv.client_snapshot),
      qrUrl,
    })

  const openEditor = (inv: InvoiceRecord) => {
    if (!viewer.isAdmin) return
    setEditing(inv)
    setFormOpen(true)
  }

  const download = async (inv: InvoiceRecord) => {
    const payment = inv.payment_snapshot as {
      type?: string
      qr_path?: string | null
    } | null
    try {
      const qrUrl =
        payment?.type === "crypto" ? await signQr(payment.qr_path) : null
      const data = docData(inv, qrUrl)
      await downloadInvoicePdf(data, invoiceFileName(data))
    } catch {
      toast.error(ti("errDownload"))
    }
  }

  /** A fresh draft with the same items and terms, numbered for today. */
  const duplicate = async (inv: InvoiceRecord) => {
    const db = createClient()
    const today = new Date()
    const prefix = `INV-KR-${format(today, "yyMM")}-`
    const { data: used } = await db
      .from("project_invoices")
      .select("invoice_number")
      .like("invoice_number", `${prefix}%`)
    const number = nextInvoiceNumber(
      ((used ?? []) as { invoice_number: string }[]).map(
        (r) => r.invoice_number,
      ),
      today,
    )
    const lines = ((inv.line_items ?? []) as Record<string, unknown>[]).map(
      (l) => ({ ...l, id: crypto.randomUUID() }),
    )
    const schedule = (
      (inv.payment_schedule ?? []) as Record<string, unknown>[]
    ).map((item, i) => ({
      ...item,
      id: crypto.randomUUID(),
      status: i === 0 ? "unpaid" : "pending",
      paid_at: null,
    }))
    const { data, error } = await db
      .from("project_invoices")
      .insert({
        project_id: projectId,
        invoice_number: number,
        status: "Draft",
        issue_date: format(today, "yyyy-MM-dd"),
        due_date: format(addDays(today, 14), "yyyy-MM-dd"),
        amount_idr: inv.amount_idr,
        amount_paid_idr: 0,
        currency: inv.currency,
        fx_rate: inv.fx_rate,
        payment_method_id: inv.payment_method_id,
        notes: inv.notes,
        line_items: lines as unknown as InvoiceRecord["line_items"],
        payment_schedule:
          schedule as unknown as InvoiceRecord["payment_schedule"],
        client_snapshot: inv.client_snapshot,
        payment_snapshot: inv.payment_snapshot,
        terms_note: inv.terms_note,
      })
      .select("*")
      .single()
    if (error || !data) return void toast.error(ti("errDuplicate"))
    toast.success(ti("duplicated", { number }))
    await refresh()
    openEditor(data as InvoiceRecord)
  }

  const menu = (inv: InvoiceRecord): RowMenuItem[] => [
    ...(viewer.isAdmin
      ? [
          { label: tc("edit"), onSelect: () => openEditor(inv) },
          { label: t("duplicate"), onSelect: () => void duplicate(inv) },
        ]
      : []),
    { label: t("downloadPdf"), onSelect: () => void download(inv) },
    ...(viewer.isAdmin
      ? [
          {
            label: tc("delete"),
            destructive: true,
            separatorBefore: true,
            onSelect: () => setDeleting(inv),
          },
        ]
      : []),
  ]

  const visible = useMemo(
    () =>
      invoices.filter((inv) =>
        filter === "all"
          ? true
          : filter === "open"
            ? isOpen(inv)
            : inv.status === filter,
      ),
    [invoices, filter],
  )

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title={t("invoice")}
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle
              value={view}
              onValueChange={setView}
              modes={["grid", "list"]}
            />
            {viewer.isAdmin && (
              <Button
                onClick={() => {
                  setEditing(undefined)
                  setFormOpen(true)
                }}
              >
                <RiAddLine data-icon="inline-start" />
                {t("newInvoice")}
              </Button>
            )}
          </div>
        }
      />
      <StatStrip
        items={[
          { key: "received", label: t("received"), value: rupiah(received) },
          { key: "unpaid", label: t("unpaid"), value: rupiah(openAmount) },
          {
            key: "open",
            label: t("filterUnpaid"),
            value: counts.open,
          },
          { key: "paid", label: t("statusPaid"), value: counts.Paid },
        ]}
      />
      <div className="flex flex-col gap-6 pb-4">
        <TabNavigation>
          {FILTERS.map(({ key, label }) => (
            <TabNavigationLink
              key={key}
              active={filter === key}
              onClick={() => setFilter(key)}
              showLeadingIcon={false}
            >
              {label === "filterAll" ? tc("all") : t(label)}
              {counts[key] > 0 && (
                <span className="text-tertiary-foreground ml-1.5 tabular-nums">
                  {counts[key]}
                </span>
              )}
            </TabNavigationLink>
          ))}
        </TabNavigation>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6" />
          </div>
        ) : visible.length === 0 ? (
          <div className="bleed">
            <EmptyState
              title={
                invoices.length ? t("noInvoicesInFilter") : t("noInvoices")
              }
              description={
                invoices.length ? t("tryOtherFilter") : t("noInvoicesHint")
              }
              icon={<RiMoneyDollarCircleLine className="size-5" />}
              placement="inner"
            />
          </div>
        ) : view === "grid" ? (
          // Grid like the documents page: the invoice's first page on a card,
          // status chip on it, actions in ⋯.
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 pb-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((inv) => {
              const status = STATUS[inv.status] ?? STATUS.Draft
              const cur = inv.currency ?? "IDR"
              return (
                <div
                  key={inv.id}
                  role="button"
                  tabIndex={viewer.isAdmin ? 0 : -1}
                  onClick={() => openEditor(inv)}
                  onKeyDown={(e) => e.key === "Enter" && openEditor(inv)}
                  className={cn(
                    "group/row focus-visible:ring-focus-ring flex min-w-0 flex-col gap-2 rounded-xl outline-none focus-visible:ring-2",
                    viewer.isAdmin && "cursor-pointer",
                  )}
                >
                  <InvoiceThumb
                    data={docData(inv)}
                    className="ring-border/60 rounded-xl ring-1 transition-[filter] duration-150 group-hover/row:brightness-95"
                  >
                    <span className="absolute top-2 left-2">
                      <Chip className="static flex items-center gap-1.5">
                        <span
                          className={cn("size-1.5 rounded-full", status.dot)}
                        />
                        {t(status.label)}
                      </Chip>
                    </span>
                    <Chip className="top-2 right-2">{cur}</Chip>
                  </InvoiceThumb>
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="truncate">{inv.invoice_number}</span>
                        <span className="shrink-0 tabular-nums">
                          {money(inv.amount_idr, cur)}
                        </span>
                      </span>
                      <span className="text-tertiary-foreground truncate text-[13px] tabular-nums first-letter:uppercase">
                        {t("dueOn", { date: day(inv.due_date) })}
                        {due(inv) && (
                          <span className={due(inv)!.tone}>
                            {" · "}
                            {due(inv)!.label}
                          </span>
                        )}
                      </span>
                    </div>
                    <RowMenu label={inv.invoice_number} items={menu(inv)} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bleed">
            <div role="table" className="text-sm">
              <div
                role="row"
                className={cn(
                  ROW,
                  "text-muted-foreground border-b py-2 text-xs",
                )}
              >
                <span role="columnheader">{t("invoice")}</span>
                <span role="columnheader">{t("colItems")}</span>
                <span role="columnheader">{t("dueDate")}</span>
                <span role="columnheader">{t("status")}</span>
                <span role="columnheader" className="text-right">
                  {t("colAmount")}
                </span>
                <span />
              </div>
              {visible.map((inv) => {
                const status = STATUS[inv.status] ?? STATUS.Draft
                const cur = inv.currency ?? "IDR"
                const lines = (inv.line_items ?? []) as {
                  description: string
                }[]
                const total = Number(inv.amount_idr) || 0
                const paid = Number(inv.amount_paid_idr) || 0
                const late = due(inv)
                return (
                  <div
                    key={inv.id}
                    role="row"
                    tabIndex={viewer.isAdmin ? 0 : undefined}
                    onClick={() => openEditor(inv)}
                    onKeyDown={(e) => e.key === "Enter" && openEditor(inv)}
                    className={cn(
                      ROW,
                      "group/row hover:bg-muted/20 min-h-14 border-b py-2.5 transition-colors",
                      viewer.isAdmin && "cursor-pointer",
                    )}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {inv.invoice_number}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {day(inv.issue_date)}
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">
                        {lines[0]?.description || "—"}
                      </span>
                      {lines.length > 1 && (
                        <span className="text-muted-foreground text-xs">
                          {t("moreItems", { n: lines.length - 1 })}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col text-xs">
                      <span>{day(inv.due_date)}</span>
                      {late && <span className={late.tone}>{late.label}</span>}
                    </div>
                    <span>
                      <span
                        className={cn(
                          "rounded-sm px-1.5 py-0.5 text-xs",
                          status.tone,
                        )}
                      >
                        {t(status.label)}
                      </span>
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-medium tabular-nums">
                        {money(total, cur)}
                      </span>
                      {paid > 0 && paid < total && (
                        <span className="flex items-center gap-1.5">
                          <span className="bg-muted h-1 w-12 overflow-hidden rounded-full">
                            <span
                              className="bg-success block h-full rounded-full"
                              style={{ width: `${(paid / total) * 100}%` }}
                            />
                          </span>
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {t("paidAmount", { amount: money(paid, cur) })}
                          </span>
                        </span>
                      )}
                    </div>
                    <RowMenu label={inv.invoice_number} items={menu(inv)} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {viewer.isAdmin && (
          <>
            {formMounted && (
              <InvoiceEditorDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                projectId={projectId}
                invoice={editing}
              />
            )}
            <ConfirmDialog
              open={Boolean(deleting)}
              onOpenChange={(o) => !o && setDeleting(null)}
              title={t("deleteNamed", {
                name: deleting?.invoice_number ?? t("invoiceFallback"),
              })}
              description={t("invoiceDeleteDescription")}
              confirmText={tc("delete")}
              cancelText={tc("cancel")}
              variant="destructive"
              onConfirm={async () => {
                if (!deleting) return
                const result = await deleteInvoice(deleting.id)
                if (result.success) toast.success(t("invoiceDeleted"))
                else toast.error(t("invoiceDeleteFailed"))
                setDeleting(null)
                refresh()
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}
