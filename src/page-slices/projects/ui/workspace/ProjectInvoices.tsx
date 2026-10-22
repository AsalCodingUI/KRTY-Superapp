"use client"

import { PageHeader } from "@/components/page-header"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { GroupedList, ListRow, ListRowActions } from "@/components/grouped-list"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  deleteInvoice,
  getInvoicesByProject,
  getPaymentMethods,
} from "@/entities/finance/api/client"
import { cn } from "@/lib/utils"
import { RiAddLine, RiMoneyDollarCircleLine } from "@/shared/ui/lucide-icons"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { differenceInCalendarDays, format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import dynamic from "next/dynamic"
import { useState } from "react"
import { toast } from "sonner"
import type { InvoiceRow, PaymentMethodRow } from "../InvoiceFormDialog"
import { useViewer } from "./data"

// Form dialog loads on first open.
const InvoiceFormDialog = dynamic(() =>
  import("../InvoiceFormDialog").then((m) => m.InvoiceFormDialog),
)

const STATUS: Record<string, { label: string; tone: string }> = {
  Draft: { label: "Draft", tone: "bg-muted text-muted-foreground" },
  Sent: { label: "Terkirim", tone: "bg-info/15 text-info" },
  Partial: { label: "Sebagian", tone: "bg-warning/15 text-warning" },
  Paid: { label: "Lunas", tone: "bg-success/15 text-success" },
  Overdue: { label: "Telat", tone: "bg-destructive/15 text-destructive" },
}

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "Draft", label: "Draft" },
  { key: "open", label: "Belum lunas" },
  { key: "Paid", label: "Lunas" },
] as const

const rupiah = (value: number | null) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)

const isOpen = (inv: InvoiceRow) =>
  ["Sent", "Partial", "Overdue"].includes(inv.status)

/** Project invoices: what came in, what's still open, and every invoice. */
export function ProjectInvoices({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient()
  const viewer = useViewer()
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [formMounted, setFormMounted] = useState(false)
  if (formOpen && !formMounted) setFormMounted(true)
  const [editing, setEditing] = useState<InvoiceRow | undefined>()
  const [deleting, setDeleting] = useState<InvoiceRow | null>(null)

  const { data: invoicesResult, isLoading } = useQuery({
    queryKey: ["invoices", projectId],
    queryFn: () => getInvoicesByProject(projectId),
  })
  const { data: methodsResult } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => getPaymentMethods(),
    enabled: viewer.isAdmin,
  })
  const invoices: InvoiceRow[] = invoicesResult?.success
    ? invoicesResult.data
    : []
  const methods: PaymentMethodRow[] = methodsResult?.success
    ? methodsResult.data
    : []
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["invoices", projectId] })

  const received = invoices.reduce(
    (sum, inv) => sum + (Number(inv.amount_paid_idr) || 0),
    0,
  )
  const open = invoices.filter(isOpen)
  const openAmount = open.reduce(
    (sum, inv) =>
      sum + (Number(inv.amount_idr) || 0) - (Number(inv.amount_paid_idr) || 0),
    0,
  )

  const counts: Record<string, number> = {
    all: invoices.length,
    Draft: invoices.filter((i) => i.status === "Draft").length,
    open: open.length,
    Paid: invoices.filter((i) => i.status === "Paid").length,
  }
  const visible = invoices.filter((inv) =>
    filter === "all"
      ? true
      : filter === "open"
        ? isOpen(inv)
        : inv.status === filter,
  )

  return (
    <div className="flex flex-col">
      <PageHeader
        className="pt-6 pb-4"
        title="Invoice"
        actions={
          viewer.isAdmin && (
            <Button
              onClick={() => {
                setEditing(undefined)
                setFormOpen(true)
              }}
            >
              <RiAddLine data-icon="inline-start" />
              Invoice baru
            </Button>
          )
        }
      />
      <div className="flex flex-col gap-5 pb-4">
        <div className="ring-foreground/10 grid overflow-hidden rounded-xl ring-1 sm:grid-cols-2">
          <div className="flex flex-col gap-1 p-5 sm:border-r">
            <span className="text-muted-foreground text-sm">Diterima</span>
            <span className="text-2xl font-semibold tabular-nums">
              {rupiah(received)}
            </span>
          </div>
          <div className="flex flex-col gap-1 border-t p-5 sm:border-t-0">
            <span className="text-muted-foreground text-sm">Belum dibayar</span>
            <span className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">
                {rupiah(openAmount)}
              </span>
              <span className="text-muted-foreground text-sm">
                {open.length} invoice
              </span>
            </span>
          </div>
        </div>

        <div className="bg-muted/60 flex w-fit items-center gap-0.5 rounded-md p-0.5 text-sm">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                "text-muted-foreground hover:text-foreground flex h-7 items-center gap-1.5 rounded-[5px] px-2.5",
                filter === key && "bg-background text-foreground shadow-xs",
              )}
            >
              {label}
              <span className="text-muted-foreground/80 tabular-nums">
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            title={
              invoices.length
                ? "Tidak ada invoice di filter ini"
                : "Belum ada invoice"
            }
            description={
              invoices.length
                ? "Coba filter lain."
                : "Buat invoice pertama untuk mencatat pembayaran project."
            }
            icon={<RiMoneyDollarCircleLine className="size-5" />}
            placement="inner"
          />
        ) : (
          <GroupedList>
            {visible.map((inv) => {
              const status = STATUS[inv.status] ?? STATUS.Draft
              const days = differenceInCalendarDays(
                new Date(inv.due_date),
                new Date(),
              )
              return (
                <ListRow key={inv.id}>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium">{inv.invoice_number}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(inv.issue_date), "d MMM yyyy", {
                        locale: idLocale,
                      })}
                    </span>
                  </div>
                  {viewer.isAdmin && (
                    <ListRowActions>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(inv)
                          setFormOpen(true)
                        }}
                      >
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(inv)}
                      >
                        Hapus
                      </Button>
                    </ListRowActions>
                  )}
                  <div className="flex w-32 shrink-0 flex-col text-right text-xs">
                    <span>
                      {format(new Date(inv.due_date), "d MMM", {
                        locale: idLocale,
                      })}
                    </span>
                    {inv.status !== "Paid" && inv.status !== "Draft" && (
                      <span
                        className={
                          days < 0 ? "text-destructive" : "text-success"
                        }
                      >
                        {days < 0
                          ? `telat ${-days} hari`
                          : days === 0
                            ? "hari ini"
                            : `${days} hari lagi`}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "w-20 shrink-0 rounded-sm px-1.5 py-0.5 text-center text-xs",
                      status.tone,
                    )}
                  >
                    {status.label}
                  </span>
                  <span className="w-32 shrink-0 text-right font-medium tabular-nums">
                    {rupiah(inv.amount_idr)}
                  </span>
                </ListRow>
              )
            })}
          </GroupedList>
        )}

        {viewer.isAdmin && (
          <>
            {formMounted && (
              <InvoiceFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                projectId={projectId}
                invoice={editing}
                paymentMethods={methods}
                onSuccess={refresh}
              />
            )}
            <ConfirmDialog
              open={Boolean(deleting)}
              onOpenChange={(o) => !o && setDeleting(null)}
              title={`Hapus ${deleting?.invoice_number ?? "invoice"}?`}
              description="Invoice dihapus permanen."
              confirmText="Hapus"
              cancelText="Batal"
              variant="destructive"
              onConfirm={async () => {
                if (!deleting) return
                const result = await deleteInvoice(deleting.id)
                if (result.success) toast.success("Invoice dihapus")
                else toast.error("Gagal menghapus invoice.")
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
