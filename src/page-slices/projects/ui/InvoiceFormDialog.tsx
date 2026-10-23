"use client"

import { DateField } from "@/components/date-field"
import {
  deletePaymentMethod,
  saveInvoice,
  savePaymentMethod,
  updateInvoice,
  updatePaymentMethod,
  type InvoiceStatus,
} from "@/entities/finance/api/client"
import { createClient } from "@/shared/api/supabase/client"
import type { Database } from "@/shared/types/database.types"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBin6Line,
} from "@/shared/ui/lucide-icons"
import { useT } from "@/shared/i18n/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

export type InvoiceRow = Database["public"]["Tables"]["project_invoices"]["Row"]
export type PaymentMethodRow =
  Database["public"]["Tables"]["payment_methods"]["Row"]

export type LineItemForm = {
  id: string
  description: string
  quantity: number
  unit_price_idr: number
  total_idr: number
}

export const INVOICE_STATUS_VARIANTS: Record<
  InvoiceStatus,
  "secondary" | "info" | "warning" | "success" | "destructive"
> = {
  Draft: "secondary",
  Sent: "info",
  Partial: "warning",
  Paid: "success",
  Overdue: "destructive",
  Refunded: "destructive",
}

export function PaymentMethodManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("finance")
  const tc = useT("common")
  const supabase = useMemo(() => createClient(), [])
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const { data: methods, isLoading } = useQuery({
    queryKey: ["payment-methods", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name", { ascending: true })
      if (error) throw error
      return (data || []) as PaymentMethodRow[]
    },
    enabled: open,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
    queryClient.invalidateQueries({ queryKey: ["payment-methods", "all"] })
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    const result = await savePaymentMethod(newName.trim())
    if (result.success) {
      setNewName("")
      invalidate()
    } else {
      toast.error(t("addMethodFailed"))
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !editingName.trim()) return
    const result = await updatePaymentMethod(editingId, editingName.trim())
    if (result.success) {
      setEditingId(null)
      invalidate()
    } else {
      toast.error(t("updateFailed"))
    }
  }

  const handleDelete = async () => {
    if (!pendingDeleteId) return
    const result = await deletePaymentMethod(pendingDeleteId)
    if (result.success) {
      invalidate()
    } else {
      toast.error(t("deleteFailed"))
    }
    setPendingDeleteId(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("managePaymentMethods")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Spinner className="size-4" />
              </div>
            ) : (
              (methods || []).map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  {editingId === m.id ? (
                    <>
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleUpdate}
                      >
                        <RiCheckLine className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingId(null)}
                      >
                        <RiCloseLine className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span
                        className="text-foreground flex-1 cursor-pointer truncate text-sm"
                        onClick={() => {
                          setEditingId(m.id)
                          setEditingName(m.name)
                        }}
                      >
                        {m.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDeleteId(m.id)}
                        className="text-destructive"
                      >
                        <RiDeleteBin6Line className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
            <div className="flex items-center gap-2 pt-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("newMethodName")}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd()
                }}
              />
              <Button onClick={handleAdd} disabled={!newName.trim()}>
                {tc("add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        onConfirm={handleDelete}
        title={t("deleteMethodTitle")}
        description={t("deleteMethodDescription")}
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
        variant="destructive"
      />
    </>
  )
}

const CURRENCIES = ["IDR", "USD", "EUR", "SGD", "AUD", "GBP"]

const formatCurrency = (n: number, currency = "IDR") => {
  try {
    return n.toLocaleString("id-ID", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
    })
  } catch {
    return `${currency} ${n.toLocaleString("id-ID")}`
  }
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
  projectId,
  invoice,
  paymentMethods,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  invoice?: InvoiceRow
  paymentMethods: PaymentMethodRow[]
  onSuccess: () => void
}) {
  const t = useT("finance")
  const tc = useT("common")
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [pmDialogOpen, setPmDialogOpen] = useState(false)

  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [status, setStatus] = useState<InvoiceStatus>("Draft")
  const [issueDate, setIssueDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [paymentMethodId, setPaymentMethodId] = useState<string>("")
  const [amountIdr, setAmountIdr] = useState("")
  const [amountPaidIdr, setAmountPaidIdr] = useState("")
  // Amounts are in `currency`; fxRate = IDR actually received per 1 unit.
  const [currency, setCurrency] = useState("IDR")
  const [fxRate, setFxRate] = useState("")
  const [notes, setNotes] = useState("")
  const [lineItems, setLineItems] = useState<LineItemForm[]>([])

  useEffect(() => {
    if (invoice) {
      setInvoiceNumber(invoice.invoice_number)
      setStatus(invoice.status)
      setIssueDate(invoice.issue_date)
      setDueDate(invoice.due_date)
      setPaymentMethodId(invoice.payment_method_id || "")
      setAmountIdr(String(invoice.amount_idr))
      setAmountPaidIdr(String(invoice.amount_paid_idr))
      setCurrency(invoice.currency ?? "IDR")
      setFxRate(invoice.fx_rate ? String(invoice.fx_rate) : "")
      setNotes(invoice.notes || "")
      setLineItems((invoice.line_items as unknown as LineItemForm[]) || [])
    } else {
      setInvoiceNumber("")
      setStatus("Draft")
      setIssueDate("")
      setDueDate("")
      setPaymentMethodId("")
      setAmountIdr("")
      setAmountPaidIdr("")
      setCurrency("IDR")
      setFxRate("")
      setNotes("")
      setLineItems([])
    }
  }, [invoice, open])

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unit_price_idr: 0,
        total_idr: 0,
      },
    ])
  }

  const updateLineItem = (
    id: string,
    field: keyof LineItemForm,
    value: string | number,
  ) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        updated.total_idr = updated.quantity * updated.unit_price_idr
        return updated
      }),
    )
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id))
  }

  const lineItemsTotal = lineItems.reduce(
    (sum, item) => sum + item.total_idr,
    0,
  )

  const handleSubmit = async () => {
    if (!invoiceNumber || !issueDate || !dueDate) {
      toast.error(t("invoiceRequired"))
      return
    }
    setSaving(true)
    try {
      const payload = {
        projectId,
        invoiceNumber,
        status,
        issueDate,
        dueDate,
        amountIdr: Number(amountIdr) || 0,
        amountPaidIdr: Number(amountPaidIdr) || 0,
        currency,
        fxRate: currency === "IDR" ? null : Number(fxRate) || null,
        paymentMethodId: paymentMethodId || null,
        notes: notes || null,
        lineItems,
      }

      const result = invoice
        ? await updateInvoice(invoice.id, payload)
        : await saveInvoice(payload)

      if (result.success) {
        toast.success(invoice ? t("invoiceUpdated") : t("invoiceCreated"))
        queryClient.invalidateQueries({ queryKey: ["invoices", projectId] })
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error("error" in result ? result.error : t("saveFailed"))
      }
    } catch {
      toast.error(t("saveInvoiceFailed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[35rem]">
          <DialogHeader>
            <DialogTitle>
              {invoice ? t("editInvoice") : t("newInvoice")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>{t("invoiceNumber")}</Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-KR-2601-001"
                />
              </div>
              <div className="space-y-1">
                <Label>{t("status")}</Label>
                <Select
                  value={status}
                  onValueChange={(v) =>
                    v !== null && setStatus(v as InvoiceStatus)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">{t("statusDraft")}</SelectItem>
                    <SelectItem value="Sent">{t("statusSent")}</SelectItem>
                    <SelectItem value="Partial">
                      {t("statusPartial")}
                    </SelectItem>
                    <SelectItem value="Paid">{t("statusPaid")}</SelectItem>
                    <SelectItem value="Overdue">
                      {t("statusOverdue")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("issueDate")}</Label>
                <DateField value={issueDate} onChange={setIssueDate} />
              </div>
              <div className="space-y-1">
                <Label>{t("dueDate")}</Label>
                <DateField value={dueDate} onChange={setDueDate} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label>{t("paymentMethod")}</Label>
                  <button
                    type="button"
                    className="text-primary text-xs font-medium hover:underline"
                    onClick={() => setPmDialogOpen(true)}
                  >
                    {t("manage")}
                  </button>
                </div>
                <Select
                  value={paymentMethodId}
                  onValueChange={(v) => v !== null && setPaymentMethodId(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem key={pm.id} value={pm.id}>
                        {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("currency")}</Label>
                <Select
                  value={currency}
                  onValueChange={(v) => v && setCurrency(v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("amountIn", { currency })}</Label>
                <Input
                  type="number"
                  value={amountIdr}
                  onChange={(e) => setAmountIdr(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <Label>{t("amountPaidIn", { currency })}</Label>
                <Input
                  type="number"
                  value={amountPaidIdr}
                  onChange={(e) => setAmountPaidIdr(e.target.value)}
                  placeholder="0"
                />
              </div>
              {/* Amount and paid pair up; the rate only shows for foreign
                  currency, under them. */}
              {currency !== "IDR" ? (
                <div className="space-y-1">
                  <Label>{t("rateReceived", { currency })}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={fxRate}
                    onChange={(e) => setFxRate(e.target.value)}
                    placeholder={t("rateDefaultPlaceholder")}
                  />
                </div>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label>{t("notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                className="min-h-[60px]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("lineItems")}</Label>
                <Button variant="outline" onClick={addLineItem}>
                  <RiAddLine className="mr-1 size-3" /> {t("addItem")}
                </Button>
              </div>
              {lineItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-foreground/[0.03] grid grid-cols-12 items-end gap-2 rounded-lg p-3"
                >
                  <div className="col-span-12 space-y-1 sm:col-span-5">
                    <Label>{t("description")}</Label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(item.id, "description", e.target.value)
                      }
                      placeholder={t("itemDescription")}
                    />
                  </div>
                  <div className="col-span-3 space-y-1 sm:col-span-2">
                    <Label>{t("qty")}</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(
                          item.id,
                          "quantity",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="col-span-4 space-y-1 sm:col-span-2">
                    <Label>{t("unitPrice")}</Label>
                    <Input
                      type="number"
                      value={item.unit_price_idr}
                      onChange={(e) =>
                        updateLineItem(
                          item.id,
                          "unit_price_idr",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div className="col-span-4 space-y-1 sm:col-span-2">
                    <Label>{t("total")}</Label>
                    <Input
                      value={item.total_idr}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      className="text-destructive"
                    >
                      <RiDeleteBin6Line className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {lineItems.length > 0 && (
                <div className="text-foreground text-right text-sm font-semibold">
                  {t("totalWith", {
                    amount: formatCurrency(lineItemsTotal, currency),
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              {tc("cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Spinner data-icon="inline-start" />}
              {invoice ? t("update") : t("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentMethodManagerDialog
        open={pmDialogOpen}
        onOpenChange={setPmDialogOpen}
      />
    </>
  )
}
