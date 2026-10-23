"use client"

import { DateField } from "@/components/date-field"
import {
  deleteSubscription,
  saveSubscription,
} from "@/app/(main)/finance/actions/subscription-actions"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"
import {
  categoryLabel,
  CURRENCIES,
  rupiah,
  SUBSCRIPTION_CATEGORIES,
  type FxRates,
  type Subscription,
} from "@/entities/finance/lib/money"
import { financeKeys } from "../model/data"

const CYCLES = [
  { value: "monthly", label: "cycleMonthly" },
  { value: "yearly", label: "cycleYearly" },
] as const

/** Add or edit a recurring cost; editing also offers delete. */
export function SubscriptionDialog({
  subscription,
  rates,
  open,
  onOpenChange,
}: {
  subscription: Subscription | null
  rates: FxRates
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <SubscriptionForm
            subscription={subscription}
            rates={rates}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SubscriptionForm({
  subscription,
  rates,
  onDone,
}: {
  subscription: Subscription | null
  rates: FxRates
  onDone: () => void
}) {
  const t = useT("finance")
  const tc = useT("common")
  const queryClient = useQueryClient()
  const [name, setName] = useState(subscription?.name ?? "")
  const [category, setCategory] = useState<string>(
    subscription?.category ?? SUBSCRIPTION_CATEGORIES[0],
  )
  const [amount, setAmount] = useState(
    subscription ? String(Number(subscription.amount_idr)) : "",
  )
  const [currency, setCurrency] = useState<string>(
    subscription?.currency ?? "IDR",
  )
  const [fxRate, setFxRate] = useState(
    subscription?.fx_rate ? String(subscription.fx_rate) : "",
  )
  const parsedAmount = parseAmount(amount)
  const effectiveRate =
    currency === "IDR" ? 1 : parseAmount(fxRate) || rates[currency] || null
  const idrPreview = effectiveRate ? parsedAmount * effectiveRate : null
  const [cycle, setCycle] = useState<"monthly" | "yearly">(
    subscription?.cycle ?? "monthly",
  )
  const [anchorDate, setAnchorDate] = useState(
    subscription?.anchor_date ?? format(new Date(), "yyyy-MM-dd"),
  )
  const [endsOn, setEndsOn] = useState(subscription?.ends_on ?? "")
  const [notes, setNotes] = useState(subscription?.notes ?? "")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: financeKeys.subscriptions() })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = await saveSubscription(subscription?.id ?? null, {
      name,
      category,
      amount: parsedAmount,
      currency,
      fxRate: currency === "IDR" ? null : parseAmount(fxRate) || null,
      cycle,
      anchorDate,
      endsOn: endsOn || null,
      notes,
    })
    setSaving(false)
    if (!result.success) return toast.error(result.error)
    toast.success(
      subscription ? t("subscriptionUpdated") : t("subscriptionAdded"),
    )
    refresh()
    onDone()
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {subscription ? t("editSubscription") : t("addSubscription")}
        </DialogTitle>
        <DialogDescription>{t("subscriptionDescription")}</DialogDescription>
      </DialogHeader>
      <form
        id="subscription-form"
        onSubmit={submit}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="sub-name">{t("name")}</Label>
          <Input
            id="sub-name"
            required
            autoFocus
            maxLength={120}
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label>{t("category")}</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...new Set([...SUBSCRIPTION_CATEGORIES, category])].map(
                  (c) => (
                    <SelectItem key={c} value={c}>
                      {categoryLabel(t, c)}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("cycle")}</Label>
            <Select
              value={cycle}
              onValueChange={(v) => v && setCycle(v as "monthly" | "yearly")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => {
                    const label = CYCLES.find((c) => c.value === v)?.label
                    return label ? t(label) : undefined
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CYCLES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {t(c.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
          <div className="flex flex-col gap-2">
            <Label>{t("currency")}</Label>
            <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
              <SelectTrigger className="w-full" aria-label={t("currency")}>
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-amount">{t("amountPerBill")}</Label>
            <Input
              id="sub-amount"
              required
              inputMode="decimal"
              placeholder={currency === "IDR" ? "750000" : "15"}
              value={amount}
              onChange={(e) => setAmount(cleanAmount(e.target.value, currency))}
            />
          </div>
        </div>
        {currency !== "IDR" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-rate">
              {t("ratePaid", { currency })}{" "}
              <span className="text-muted-foreground font-normal">
                {t("optionalParen")}
              </span>
            </Label>
            <Input
              id="sub-rate"
              inputMode="numeric"
              placeholder={
                rates[currency]
                  ? t("defaultRate", {
                      rate: rates[currency].toLocaleString("id-ID"),
                    })
                  : t("noDefaultRate")
              }
              value={fxRate}
              onChange={(e) => setFxRate(cleanAmount(e.target.value, "IDR"))}
            />
            <p className="text-muted-foreground text-[13px]">
              {idrPreview !== null
                ? t("idrPreview", { amount: rupiah(idrPreview) })
                : t("rateHint")}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-anchor">{t("firstBill")}</Label>
            <DateField
              id="sub-anchor"
              required
              value={anchorDate}
              onChange={setAnchorDate}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sub-ends">
              {t("endsOn")}{" "}
              <span className="text-muted-foreground font-normal">
                {t("optionalParen")}
              </span>
            </Label>
            <DateField
              id="sub-ends"
              min={anchorDate}
              value={endsOn}
              onChange={setEndsOn}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sub-notes">
            {t("notes")}{" "}
            <span className="text-muted-foreground font-normal">
              {t("optionalParen")}
            </span>
          </Label>
          <Textarea
            id="sub-notes"
            rows={2}
            maxLength={1000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
      <DialogFooter>
        {subscription && (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive mr-auto"
            onClick={() => setConfirmDelete(true)}
          >
            {tc("delete")}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onDone}>
          {tc("cancel")}
        </Button>
        <Button type="submit" form="subscription-form" disabled={saving}>
          {saving ? tc("saving") : tc("save")}
        </Button>
      </DialogFooter>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("deleteNamed", {
          name: subscription?.name ?? t("subscriptionFallback"),
        })}
        description={t("deleteSubscriptionDescription")}
        confirmText={tc("delete")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!subscription) return
          const result = await deleteSubscription(subscription.id)
          if (!result.success) return void toast.error(result.error)
          toast.success(t("subscriptionDeleted"))
          refresh()
          onDone()
        }}
      />
    </>
  )
}

/** Digits only for IDR; digits and one decimal separator otherwise. */
export function cleanAmount(value: string, currency: string) {
  if (currency === "IDR")
    return value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "")
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "")
  const [whole, ...rest] = normalized.split(".")
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}` : whole
}

export const parseAmount = (value: string) => Number(value) || 0
