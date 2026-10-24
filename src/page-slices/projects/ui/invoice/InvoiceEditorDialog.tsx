"use client"

import { DatePicker } from "@/components/date-picker"
import { SegmentedControl } from "@/components/segmented-control"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Collapse } from "@/components/ui/collapse"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { CURRENCIES, money } from "@/entities/finance/lib/money"
import {
  defaultTermsNote,
  deriveStatus,
  invoiceTotals,
  needsVerification,
  nextInvoiceNumber,
  presetOf,
  schedulePreset,
  type ClientSnapshot,
  type InvoiceLine,
  type InvoiceStatus,
  type PaymentSnapshot,
  type ScheduleItem,
  type ScheduleStatus,
  type SchedulePreset,
} from "@/entities/finance/lib/invoice"
import { createClient } from "@/shared/api/supabase/client"
import { useDateLocale, useT } from "@/shared/i18n/client"
import type { Database } from "@/shared/types/database.types"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useQueryClient } from "@tanstack/react-query"
import { addDays, format, formatDistanceToNow, parseISO } from "date-fns"
import {
  Building2,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  FileText,
  Plus,
  RefreshCW as RefreshCw,
  SlidersHorizontal as Settings2,
  TriangleAlert as AlertTriangle,
  Wallet,
} from "@/components/icons"
import {
  GripVertical,
  ListOrdered,
  Maximize2,
  Minus,
  StickyNote,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { PortalContainerContext } from "@/components/ui/portal-container"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { useWorkspace } from "../workspace/data"
import {
  invoiceKeys,
  useAgency,
  useInvoiceNumbers,
  usePaymentMethods,
  useQrUrl,
  useRefreshInvoices,
  type PaymentMethod,
} from "./data"
import {
  INVOICE_HEIGHT,
  INVOICE_WIDTH,
  InvoiceDocument,
  type InvoiceDocumentData,
} from "./InvoiceDocument"
import { InvoiceSettingsDialog } from "./InvoiceSettingsDialog"
import { invoiceFileName } from "./doc-data"
import { downloadInvoicePdf } from "./pdf"

export type InvoiceRecord =
  Database["public"]["Tables"]["project_invoices"]["Row"]

type Chosen = "Draft" | "Sent" | "Refunded"
const NO_METHOD = "__none"

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2
const ZOOM_STEP = 0.1

/** The invoice paper sits at sheet height; a dragged item lifts higher. */
const PAPER_SHADOW = "shadow-(--elev-3)"
const DRAG_SHADOW = "shadow-(--elev-4)"

const ymd = (d: Date) => format(d, "yyyy-MM-dd")

/** "1.500.000" (IDR) or "1,550.50" → number. */
function parseAmount(value: string, currency: string) {
  if (currency === "IDR") return Number(value.replace(/[^\d]/g, "")) || 0
  return Number(value.replace(/,/g, ".").replace(/[^\d.]/g, "")) || 0
}

const methodSnapshot = (m: PaymentMethod): PaymentSnapshot => ({
  id: m.id,
  name: m.name,
  type: m.type,
  details: m.details ?? {},
  notes: m.notes,
  qr_path: m.qr_path,
  verified_at: m.verified_at,
})

const sameSnapshot = (a: PaymentSnapshot, b: PaymentSnapshot) =>
  JSON.stringify([a.type, a.details, a.notes, a.qr_path]) ===
  JSON.stringify([b.type, b.details, b.notes, b.qr_path])

/**
 * Full-screen invoice editor (Air "Edit Mode" layout): the invoice on a
 * zoomable canvas on the left, the edit panel with collapsible sections and
 * Save / Cancel on the right; two floating panels, nothing else. The client
 * comes from the project's linked client (edited in the project settings).
 */
export function InvoiceEditorDialog({
  open,
  onOpenChange,
  projectId,
  invoice,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  invoice?: InvoiceRecord | null
}) {
  // The editor answers "may I close?" (it asks first when there are edits).
  const closeGuard = useRef<(() => boolean) | null>(null)
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && closeGuard.current?.()) return
        onOpenChange(next)
      }}
    >
      <DialogContent
        bare
        showCloseButton={false}
        className="grid h-[min(92svh,60rem)] w-[min(94vw,78rem)] max-w-none grid-cols-1 gap-2 overflow-visible rounded-none bg-transparent p-0 shadow-none! sm:max-w-none lg:grid-cols-[minmax(0,1fr)_28rem]"
      >
        {open && (
          <Editor
            key={invoice?.id ?? "new"}
            projectId={projectId}
            invoice={invoice ?? null}
            closeGuard={closeGuard}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/** One collapsible card in the side panel (Air "Edit Mode" style). */
function Section({
  title,
  icon: Icon,
  open,
  onToggle,
  action,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  open: boolean
  onToggle: () => void
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border">
      <div className="flex items-center gap-2 pr-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2.5 py-3.5 pl-4 text-left text-sm font-medium outline-none"
        >
          <Icon className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate">{title}</span>
        </button>
        {open && action}
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={onToggle}
          className="text-muted-foreground grid size-7 place-items-center"
        >
          <ChevronRight
            className={cn(
              "size-4 transition-transform duration-200",
              open && "rotate-90",
            )}
          />
        </button>
      </div>
      <Collapse open={open}>
        <div className="flex flex-col gap-4 px-4 pt-1 pb-4">{children}</div>
      </Collapse>
    </section>
  )
}

/** One line item; dragged by its handle to reorder. */
function SortableLine({
  id,
  index,
  children,
  onRemove,
  canRemove,
}: {
  id: string
  index: number
  children: React.ReactNode
  onRemove: () => void
  canRemove: boolean
}) {
  const t = useT("invoices")
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "bg-popover group/line nest-rounded-lg nest-p-2 relative grid grid-cols-[1.5rem_minmax(0,1fr)_2rem] items-start gap-x-1 gap-y-2 border transition-shadow duration-200",
        isDragging && cn("z-10 border-transparent", DRAG_SHADOW),
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t("dragItem")}
        className="text-muted-foreground hover:text-foreground rounded-nested flex h-8 cursor-grab touch-none flex-col items-center justify-center text-xs tabular-nums active:cursor-grabbing"
      >
        <span className="group-hover/line:hidden">{index + 1}</span>
        <GripVertical className="hidden size-4 group-hover/line:block" />
      </button>
      <div className="grid min-w-0 grid-cols-2 gap-2">{children}</div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("removeItem")}
        className="text-muted-foreground hover:text-destructive mt-0.5"
        disabled={!canRemove}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </li>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  )
}

function Editor({
  projectId,
  invoice,
  closeGuard,
  onClose,
}: {
  projectId: string
  invoice: InvoiceRecord | null
  closeGuard: React.RefObject<(() => boolean) | null>
  onClose: () => void
}) {
  const t = useT("invoices")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const refreshInvoices = useRefreshInvoices()
  const { data: workspace } = useWorkspace(projectId)
  const { data: methods = [], isFetched: methodsFetched } = usePaymentMethods()
  const { data: agency } = useAgency()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // --- form state ----------------------------------------------------------
  const today = new Date()
  const [number, setNumber] = useState(invoice?.invoice_number ?? "")
  const [issueDate, setIssueDate] = useState(invoice?.issue_date ?? ymd(today))
  const [dueDate, setDueDate] = useState(
    invoice?.due_date ?? ymd(addDays(today, 14)),
  )
  const [chosen, setChosen] = useState<Chosen>(
    !invoice
      ? "Draft"
      : invoice.status === "Draft" || invoice.status === "Refunded"
        ? (invoice.status as Chosen)
        : "Sent",
  )
  const [currency, setCurrency] = useState(invoice?.currency ?? "")
  const [fxRate, setFxRate] = useState(
    invoice?.fx_rate ? String(invoice.fx_rate) : "",
  )
  const [lines, setLines] = useState<InvoiceLine[]>(() => {
    const stored = (invoice?.line_items as unknown as InvoiceLine[]) ?? []
    return stored.length
      ? stored.map((l) => ({ ...l, timeline: l.timeline ?? "" }))
      : [
          {
            id: crypto.randomUUID(),
            description: "",
            timeline: "",
            quantity: 1,
            unit_price_idr: 0,
            total_idr: 0,
          },
        ]
  })
  // Typed price text per line (keeps "1.500" while typing).
  const [priceText, setPriceText] = useState<Record<string, string>>({})
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => {
    const stored =
      (invoice?.payment_schedule as unknown as ScheduleItem[]) ?? []
    return stored.length ? stored : schedulePreset("full")
  })
  const [termsNote, setTermsNote] = useState<string | null>(
    invoice?.terms_note ?? null,
  )
  const [methodId, setMethodId] = useState<string | null>(
    invoice?.payment_method_id ?? null,
  )
  const storedPayment =
    (invoice?.payment_snapshot as PaymentSnapshot | null) ?? null
  const [keepStored, setKeepStored] = useState(Boolean(storedPayment))
  const [notes, setNotes] = useState(invoice?.notes ?? "")

  // The client is the project's linked client (one source: `clients`).
  // Old invoices without a linked client keep what they stored.
  const linked = workspace?.client ?? null
  const storedClient =
    (invoice?.client_snapshot as ClientSnapshot | null) ?? null
  const client: ClientSnapshot = linked
    ? {
        name: linked.name,
        email: linked.email,
        address: linked.address ?? linked.country,
        contact: linked.contact_name,
      }
    : (storedClient ?? { name: "", email: null, address: null, contact: null })

  // A new invoice starts in the client's currency.
  const filledCurrency = useRef(Boolean(invoice))
  useEffect(() => {
    if (filledCurrency.current || !workspace) return
    filledCurrency.current = true
    if (!currency) setCurrency(linked?.currency ?? "IDR")
  }, [workspace, linked, currency])
  useEffect(() => {
    if (invoice || methodId || !methods.length) return
    setMethodId(methods.find((m) => m.is_active)?.id ?? null)
  }, [invoice, methodId, methods])

  const issue = useMemo(
    () => (issueDate ? new Date(`${issueDate}T00:00:00`) : new Date()),
    [issueDate],
  )
  const prefix = `INV-KR-${format(issue, "yyMM")}-`
  const { data: usedNumbers = [] } = useInvoiceNumbers(prefix)
  useEffect(() => {
    if (!invoice && !number && usedNumbers)
      setNumber(nextInvoiceNumber(usedNumbers, issue))
  }, [invoice, number, usedNumbers, issue])

  // --- derived ---------------------------------------------------------------
  const cur = currency || "IDR"
  const method = methods.find((m) => m.id === methodId) ?? null
  const latest = method ? methodSnapshot(method) : null
  const payment: PaymentSnapshot | null =
    keepStored && storedPayment && storedPayment.id === methodId
      ? storedPayment
      : latest
  const snapshotStale =
    keepStored &&
    storedPayment &&
    latest &&
    storedPayment.id === latest.id &&
    !sameSnapshot(storedPayment, latest)
  const { data: qrUrl } = useQrUrl(
    payment?.type === "crypto" ? payment.qr_path : null,
  )
  const totals = invoiceTotals(lines, schedule)
  const status: InvoiceStatus = deriveStatus(chosen, schedule, dueDate)
  const terms = termsNote ?? defaultTermsNote(schedule)

  const doc: InvoiceDocumentData = {
    number,
    issueDate,
    dueDate,
    status,
    currency: cur,
    agency: agency ?? {
      name: "Kretya Studio",
      tagline: "UI/UX Creative Agency",
      email: "",
      address: "",
    },
    client: client.name || client.email ? client : null,
    lines,
    schedule,
    termsNote: terms,
    payment,
    qrUrl,
  }

  // --- editing helpers -------------------------------------------------------
  const updateLine = (id: string, patch: Partial<InvoiceLine>) =>
    setLines((ls) =>
      ls.map((l) => {
        if (l.id !== id) return l
        const next = { ...l, ...patch }
        next.total_idr = next.unit_price_idr * (next.quantity || 1)
        return next
      }),
    )
  const updateTerm = (id: string, patch: Partial<ScheduleItem>) =>
    setSchedule((s) =>
      s.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              paid_at:
                patch.status === "paid"
                  ? (item.paid_at ?? new Date().toISOString())
                  : patch.status
                    ? null
                    : item.paid_at,
            }
          : item,
      ),
    )
  const markVerified = async () => {
    if (!method) return
    const { error } = await createClient()
      .from("payment_methods")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", method.id)
    if (error) return void toast.error(t("errMethod"))
    toast.success(t("verified"))
    queryClient.invalidateQueries({ queryKey: invoiceKeys.methods })
  }

  const save = async ({ draft = false }: { draft?: boolean } = {}) => {
    if (!number.trim()) return void toast.error(t("errNumber"))
    if (!issueDate || !dueDate) return void toast.error(t("errDates"))
    // A draft may still be empty; an issued invoice needs a price.
    if (!draft && !lines.some((l) => l.total_idr > 0))
      return void toast.error(t("errItems"))
    if (
      usedNumbers.includes(number.trim()) &&
      number.trim() !== invoice?.invoice_number
    )
      return void toast.error(t("errDuplicateNumber"))
    setSaving(true)
    const row = {
      project_id: projectId,
      invoice_number: number.trim(),
      status: draft ? ("Draft" as const) : status,
      issue_date: issueDate,
      due_date: dueDate,
      amount_idr: totals.total,
      // A refund means the money went back.
      amount_paid_idr: status === "Refunded" ? 0 : totals.paid,
      currency: cur,
      fx_rate: cur === "IDR" ? null : Number(fxRate) || null,
      payment_method_id: method?.id ?? null,
      notes: notes.trim() || null,
      line_items: lines.filter(
        (l) => l.description.trim() || l.total_idr > 0,
      ) as unknown as Database["public"]["Tables"]["project_invoices"]["Insert"]["line_items"],
      payment_schedule:
        schedule as unknown as Database["public"]["Tables"]["project_invoices"]["Insert"]["payment_schedule"],
      client_snapshot:
        client as unknown as Database["public"]["Tables"]["project_invoices"]["Insert"]["client_snapshot"],
      payment_snapshot:
        payment as unknown as Database["public"]["Tables"]["project_invoices"]["Insert"]["payment_snapshot"],
      terms_note: terms,
      updated_at: new Date().toISOString(),
    }
    const db = createClient()
    const { data, error } = invoice
      ? await db
          .from("project_invoices")
          .update(row)
          .eq("id", invoice.id)
          .select("id")
          .single()
      : await db.from("project_invoices").insert(row).select("id").single()
    setSaving(false)
    if (error || !data) return void toast.error(t("errSave"))
    toast.success(draft ? t("draftSaved") : invoice ? t("saved") : t("created"))
    await refreshInvoices(projectId)
    onClose()
  }

  // --- canvas: the whole page fits in the view at 100%, then zoom from there.
  // `transform` doesn't shrink layout, so the frame is sized from the
  // document's real height.
  const previewRef = useRef<HTMLDivElement>(null)
  const docRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState({ width: 900, height: 800 })
  const [docHeight, setDocHeight] = useState(INVOICE_HEIGHT)
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const el = previewRef.current
    const docEl = docRef.current
    if (!el || !docEl) return
    const observer = new ResizeObserver(() => {
      setView({ width: el.clientWidth, height: el.clientHeight })
      setDocHeight(docEl.offsetHeight)
    })
    observer.observe(el)
    observer.observe(docEl)
    return () => observer.disconnect()
  }, [])
  // Room around the page: px-10 each side, pt-14 above, pb-24 for the toolbar.
  const fit = Math.min(
    (view.width - 80) / INVOICE_WIDTH,
    (view.height - 152) / docHeight,
  )
  const scale = Math.max(0.2, fit * zoom)
  const [openSection, setOpenSection] = useState("details")
  const toggle = (id: string) => setOpenSection((s) => (s === id ? "" : id))

  // One click: the PDF of what the canvas shows, no save, no new tab.
  const [downloading, setDownloading] = useState(false)
  const download = async () => {
    setDownloading(true)
    try {
      await downloadInvoicePdf(doc, invoiceFileName(doc))
    } catch {
      toast.error(t("errDownload"))
    } finally {
      setDownloading(false)
    }
  }

  // --- unsaved edits: compare with the form once its defaults are filled.
  const formKey = JSON.stringify([
    number,
    issueDate,
    dueDate,
    chosen,
    currency,
    fxRate,
    lines,
    schedule,
    termsNote,
    methodId,
    notes,
  ])
  const baseline = useRef<string | null>(null)
  const ready =
    Boolean(workspace) &&
    methodsFetched &&
    Boolean(number) &&
    Boolean(currency) &&
    (Boolean(invoice) || Boolean(methodId) || !methods.some((m) => m.is_active))
  useEffect(() => {
    if (ready && baseline.current === null) baseline.current = formKey
  }, [ready, formKey])
  const dirty = baseline.current !== null && baseline.current !== formKey
  const [askClose, setAskClose] = useState(false)
  // The dark panel's popups (selects, date pickers) portal here to stay dark.
  const [darkLayer, setDarkLayer] = useState<HTMLDivElement | null>(null)
  const requestClose = () => (dirty ? setAskClose(true) : onClose())
  useEffect(() => {
    closeGuard.current = () => {
      if (!dirty) return false
      setAskClose(true)
      return true
    }
    return () => {
      closeGuard.current = null
    }
  }, [closeGuard, dirty])
  // Closing from the "unsaved" prompt keeps an issued invoice issued.
  const keepsDraft = !invoice || invoice.status === "Draft"

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    setLines((ls) =>
      arrayMove(
        ls,
        ls.findIndex((l) => l.id === active.id),
        ls.findIndex((l) => l.id === over.id),
      ),
    )
  }

  const preset = presetOf(schedule)
  const activeMethods = useMemo(
    () => methods.filter((m) => m.is_active || m.id === methodId),
    [methods, methodId],
  )

  return (
    <>
      {/* Canvas ------------------------------------------------------------------ */}
      <div className="dark:bg-popover relative hidden min-h-0 flex-col overflow-hidden rounded-3xl bg-white shadow-(--elev-5) lg:flex">
        <span className="text-muted-foreground absolute top-4 left-5 z-10 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
          <Eye className="size-3.5" />
          {t("preview")}
        </span>
        <div
          ref={previewRef}
          className="min-h-0 flex-1 overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex min-h-full items-start justify-center px-10 pt-14 pb-24">
            <div
              className={cn(
                "shrink-0 overflow-hidden rounded-[4px] bg-white",
                PAPER_SHADOW,
              )}
              style={{
                width: INVOICE_WIDTH * scale,
                height: docHeight * scale,
              }}
            >
              <div
                ref={docRef}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  width: INVOICE_WIDTH,
                }}
              >
                <InvoiceDocument data={doc} />
              </div>
            </div>
          </div>
        </div>
        {/* Canvas toolbar: zoom, fit, download */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4">
          <div className="bg-popover/90 pointer-events-auto flex items-center gap-2 rounded-full px-2 py-1 shadow-(--elev-1) backdrop-blur">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("zoomOut")}
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
            >
              <Minus />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("zoomIn")}
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
            >
              <Plus />
            </Button>
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <div className="bg-popover/90 pointer-events-auto flex items-center gap-1 rounded-full p-1 shadow-(--elev-1) backdrop-blur">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setZoom(1)}
            >
              <Maximize2 data-icon="inline-start" />
              {t("fitPage")}
            </Button>
          </div>
          <div className="bg-popover/90 pointer-events-auto flex items-center rounded-full p-1 shadow-(--elev-1) backdrop-blur">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              disabled={downloading}
              onClick={download}
            >
              <Download data-icon="inline-start" />
              {t("downloadPdf")}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit panel ---------------------------------------------------------------- */}
      {/* The editor is always dark, next to the white paper. */}
      {/* Out of the grid flow, so portal wrappers don't become grid items. */}
      <div ref={setDarkLayer} className="dark absolute top-0 left-0 size-0" />
      <PortalContainerContext.Provider value={darkLayer}>
        <aside className="dark bg-popover text-foreground flex min-h-0 flex-col overflow-hidden rounded-3xl [color-scheme:dark] shadow-(--elev-5)">
          <div className="flex shrink-0 flex-col gap-4 px-5 pt-5 pb-4">
            <div className="flex items-baseline justify-between gap-3">
              <DialogTitle className="text-heading truncate text-xl font-normal tracking-tight">
                {invoice ? t("editInvoice") : t("newInvoice")}
              </DialogTitle>
              <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                {money(totals.total, cur)}
              </span>
            </div>
            {/* General: status and currency, no section of their own. */}
            <div className="flex items-center gap-2">
              <SegmentedControl
                className="min-w-0 flex-1"
                value={chosen}
                onChange={setChosen}
                items={[
                  { value: "Draft", label: t("stateDraft") },
                  { value: "Sent", label: t("stateIssued") },
                  { value: "Refunded", label: t("stateRefunded") },
                ]}
              />
              <Select value={cur} onValueChange={(v) => v && setCurrency(v)}>
                <SelectTrigger className="w-24" aria-label={t("currency")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {cur !== "IDR" && (
              <Field label={t("fxRate")} htmlFor="inv-fx">
                <Input
                  id="inv-fx"
                  inputMode="numeric"
                  value={fxRate}
                  placeholder={t("fxRatePlaceholder", { currency: cur })}
                  onChange={(e) =>
                    setFxRate(e.target.value.replace(/[^\d]/g, ""))
                  }
                />
              </Field>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-4">
            {/* Details */}
            <Section
              title={t("secDetails")}
              icon={FileText}
              open={openSection === "details"}
              onToggle={() => toggle("details")}
            >
              <Field label={t("number")} htmlFor="inv-number">
                <div className="flex gap-2">
                  <Input
                    id="inv-number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("regenerate")}
                    title={t("regenerate")}
                    onClick={() =>
                      setNumber(
                        nextInvoiceNumber(
                          usedNumbers.filter(
                            (n) => n !== invoice?.invoice_number,
                          ),
                          issue,
                        ),
                      )
                    }
                  >
                    <RefreshCw />
                  </Button>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("issueDate")}>
                  <DatePicker
                    aria-label={t("issueDate")}
                    className="w-full"
                    value={issueDate ? parseISO(issueDate) : undefined}
                    onChange={(date) => setIssueDate(date ? ymd(date) : "")}
                  />
                </Field>
                <Field label={t("dueDate")}>
                  <DatePicker
                    aria-label={t("dueDate")}
                    className="w-full"
                    align="end"
                    value={dueDate ? parseISO(dueDate) : undefined}
                    disabledDays={
                      issueDate ? { before: parseISO(issueDate) } : undefined
                    }
                    onChange={(date) => setDueDate(date ? ymd(date) : "")}
                  />
                </Field>
              </div>
            </Section>

            {/* Client */}
            <Section
              title={t("secClient")}
              icon={Building2}
              open={openSection === "client"}
              onToggle={() => toggle("client")}
              action={
                <Link
                  href={`/projects/${projectId}/settings`}
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  {t("editInSettings")}
                </Link>
              }
            >
              {client.name ? (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    [t("clientName"), client.name],
                    [t("clientEmail"), client.email],
                    [t("clientContact"), client.contact],
                    [t("clientAddress"), client.address],
                  ].map(([label, value]) => (
                    <div key={label} className="flex min-w-0 flex-col gap-1">
                      <dt className="text-muted-foreground text-xs">{label}</dt>
                      <dd className="truncate" title={value ?? undefined}>
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {t("noClientLinked")}
                </p>
              )}
            </Section>

            {/* Items */}
            <Section
              title={t("secItems")}
              icon={ListOrdered}
              open={openSection === "items"}
              onToggle={() => toggle("items")}
            >
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEnd}
              >
                <SortableContext
                  items={lines.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="flex flex-col gap-2">
                    {lines.map((line, index) => (
                      <SortableLine
                        key={line.id}
                        id={line.id}
                        index={index}
                        canRemove={lines.length > 1}
                        onRemove={() =>
                          setLines((ls) => ls.filter((l) => l.id !== line.id))
                        }
                      >
                        <Input
                          aria-label={t("itemDescription")}
                          className="col-span-2"
                          value={line.description}
                          placeholder={t("itemDescriptionPlaceholder")}
                          onChange={(e) =>
                            updateLine(line.id, { description: e.target.value })
                          }
                        />
                        <Input
                          aria-label={t("itemTimeline")}
                          value={line.timeline}
                          placeholder={t("itemTimelinePlaceholder")}
                          onChange={(e) =>
                            updateLine(line.id, { timeline: e.target.value })
                          }
                        />
                        <Input
                          aria-label={t("itemPrice")}
                          inputMode="decimal"
                          placeholder={`${t("itemPrice")} (${cur})`}
                          className="text-right tabular-nums"
                          value={
                            priceText[line.id] ??
                            (line.unit_price_idr
                              ? cur === "IDR"
                                ? line.unit_price_idr.toLocaleString("id-ID")
                                : String(line.unit_price_idr)
                              : "")
                          }
                          onChange={(e) => {
                            const value = parseAmount(e.target.value, cur)
                            setPriceText((p) => ({
                              ...p,
                              [line.id]: e.target.value,
                            }))
                            updateLine(line.id, {
                              unit_price_idr: value,
                              quantity: 1,
                            })
                          }}
                          onBlur={() =>
                            setPriceText((p) => {
                              const next = { ...p }
                              delete next[line.id]
                              return next
                            })
                          }
                        />
                      </SortableLine>
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground -ml-2"
                  onClick={() =>
                    setLines((ls) => [
                      ...ls,
                      {
                        id: crypto.randomUUID(),
                        description: "",
                        timeline: ls.at(-1)?.timeline ?? "",
                        quantity: 1,
                        unit_price_idr: 0,
                        total_idr: 0,
                      },
                    ])
                  }
                >
                  <RiAddLine data-icon="inline-start" />
                  {t("addItem")}
                </Button>
                <span className="text-sm tabular-nums">
                  {money(totals.total, cur)}
                </span>
              </div>
            </Section>

            {/* Payment schedule */}
            <Section
              title={t("secPayment")}
              icon={Wallet}
              open={openSection === "payment"}
              onToggle={() => toggle("payment")}
            >
              <SegmentedControl
                value={preset}
                onChange={(p: SchedulePreset) => {
                  setSchedule(schedulePreset(p))
                  setTermsNote(null)
                }}
                items={[
                  { value: "full", label: t("presetFull") },
                  { value: "dp", label: t("presetDp") },
                  { value: "milestone", label: t("presetMilestone") },
                ]}
              />
              <div className="flex flex-col gap-2">
                {schedule.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_4.5rem_8rem_2rem] items-center gap-2"
                  >
                    <Input
                      aria-label={t("termLabel")}
                      value={item.label}
                      onChange={(e) =>
                        updateTerm(item.id, { label: e.target.value })
                      }
                    />
                    <div className="relative">
                      <Input
                        aria-label={t("termPercent")}
                        inputMode="numeric"
                        className="pr-6 text-right tabular-nums"
                        value={String(item.percent)}
                        onChange={(e) =>
                          updateTerm(item.id, {
                            percent: Math.min(
                              100,
                              Number(e.target.value.replace(/[^\d]/g, "")) || 0,
                            ),
                          })
                        }
                      />
                      <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                        %
                      </span>
                    </div>
                    <Select
                      value={item.status}
                      onValueChange={(v) =>
                        v &&
                        updateTerm(item.id, { status: v as ScheduleStatus })
                      }
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-label={t("termStatus")}
                      >
                        <SelectValue>
                          {(v: ScheduleStatus) =>
                            v === "paid"
                              ? t("termPaid")
                              : v === "pending"
                                ? t("termPending")
                                : t("termUnpaid")
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unpaid">
                          {t("termUnpaid")}
                        </SelectItem>
                        <SelectItem value="pending">
                          {t("termPending")}
                        </SelectItem>
                        <SelectItem value="paid">{t("termPaid")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("removeTerm")}
                      className="text-muted-foreground hover:text-destructive"
                      disabled={schedule.length === 1}
                      onClick={() =>
                        setSchedule((s) => s.filter((x) => x.id !== item.id))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
                {preset === "milestone" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground -ml-2 self-start"
                    onClick={() =>
                      setSchedule((s) => [
                        ...s,
                        {
                          id: crypto.randomUUID(),
                          label: `Milestone ${s.length + 1}`,
                          percent: 0,
                          status: "pending",
                        },
                      ])
                    }
                  >
                    <RiAddLine data-icon="inline-start" />
                    {t("addTerm")}
                  </Button>
                )}
                {totals.percentSum !== 100 && (
                  <p className="text-warning flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="size-3.5" />
                    {t("percentOff", { n: totals.percentSum })}
                  </p>
                )}
              </div>
              <Field label={t("termsNote")} htmlFor="inv-terms">
                <Input
                  id="inv-terms"
                  value={terms}
                  onChange={(e) => setTermsNote(e.target.value)}
                />
              </Field>
            </Section>

            {/* Payment method */}
            <Section
              title={t("secMethod")}
              icon={CreditCard}
              open={openSection === "method"}
              onToggle={() => toggle("method")}
              action={
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                >
                  <Settings2 className="size-3.5" />
                  {t("manageMethods")}
                </button>
              }
            >
              <Select
                value={methodId ?? NO_METHOD}
                onValueChange={(v) => {
                  if (!v) return
                  setMethodId(v === NO_METHOD ? null : v)
                  setKeepStored(false)
                }}
              >
                <SelectTrigger className="w-full" aria-label={t("pickMethod")}>
                  <SelectValue>
                    {(v: string) =>
                      v === NO_METHOD
                        ? t("noMethod")
                        : (methods.find((m) => m.id === v)?.name ??
                          storedPayment?.name ??
                          t("pickMethod"))
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_METHOD}>{t("noMethod")}</SelectItem>
                  {activeMethods.length > 0 && <SelectSeparator />}
                  {activeMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {snapshotStale && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    {t("snapshotChanged", { name: method?.name ?? "" })}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setKeepStored(false)}
                  >
                    {t("useLatest")}
                  </Button>
                </div>
              )}
              {method && needsVerification(method) && (
                <div className="bg-warning/10 text-warning flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm">
                  <span className="flex min-w-0 flex-1 items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    {method.verified_at
                      ? t("verifyWarning", {
                          name: method.name,
                          when: formatDistanceToNow(
                            new Date(method.verified_at),
                            {
                              addSuffix: true,
                              locale: dateLocale,
                            },
                          ),
                        })
                      : t("verifyNever", { name: method.name })}
                  </span>
                  <Button size="sm" variant="outline" onClick={markVerified}>
                    {t("verifyNow")}
                  </Button>
                </div>
              )}
            </Section>

            {/* Internal notes */}
            <Section
              title={t("secNotes")}
              icon={StickyNote}
              open={openSection === "notes"}
              onToggle={() => toggle("notes")}
            >
              <Textarea
                rows={3}
                value={notes}
                placeholder={t("notesPlaceholder")}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Section>
          </div>
          <footer className="flex shrink-0 items-center gap-2 border-t px-4 py-3">
            <Button
              variant="ghost"
              disabled={saving}
              onClick={() => save({ draft: true })}
            >
              {t("saveDraft")}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" onClick={requestClose}>
                {tc("cancel")}
              </Button>
              <Button disabled={saving} onClick={() => save()}>
                {saving ? tc("saving") : tc("save")}
              </Button>
            </div>
          </footer>
        </aside>
      </PortalContainerContext.Provider>

      {/* Closing with edits: keep them as a draft, or throw them away. */}
      <AlertDialog open={askClose} onOpenChange={setAskClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {keepsDraft ? t("unsavedTitle") : t("unsavedTitleIssued")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("unsavedDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive sm:mr-auto"
              onClick={() => {
                setAskClose(false)
                onClose()
              }}
            >
              {t("discard")}
            </Button>
            <Button variant="outline" onClick={() => setAskClose(false)}>
              {t("keepEditing")}
            </Button>
            <Button
              disabled={saving}
              onClick={async () => {
                setAskClose(false)
                await save({ draft: keepsDraft })
              }}
            >
              {keepsDraft ? t("saveDraft") : tc("save")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoiceSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  )
}
