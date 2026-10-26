"use client"

import { setFxRates } from "@/app/(main)/finance/actions/subscription-actions"
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
import { useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { CURRENCIES, type FxRates } from "@/entities/finance/lib/money"
import { financeKeys } from "../model/data"
import { cleanAmount, parseAmount } from "./SubscriptionDialog"

/**
 * Default IDR rate per currency, markup included (what the bank or card
 * actually charges). Items can still carry their own rate.
 */
export function FxRatesDialog({
  rates,
  open,
  onOpenChange,
}: {
  rates: FxRates
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("finance")
  const tc = useT("common")
  const queryClient = useQueryClient()
  const foreign = CURRENCIES.filter((c) => c !== "IDR")
  const seed = () =>
    Object.fromEntries(
      foreign.map((c) => [c, rates[c] ? String(rates[c]) : ""]),
    )
  const [values, setValues] = useState<Record<string, string>>(seed)
  const [saving, setSaving] = useState(false)
  // The page opens this dialog itself (no onOpenChange(true)), so refill the
  // fields from the saved rates each time it opens; saving empty fields
  // would clear every rate.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setValues(seed())
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, number> = {}
    for (const code of foreign) {
      const rate = parseAmount(values[code] ?? "")
      if (rate > 0) next[code] = rate
    }
    setSaving(true)
    const result = await setFxRates(next)
    setSaving(false)
    if (!result.success) return toast.error(result.error)
    toast.success(t("ratesSaved"))
    queryClient.invalidateQueries({ queryKey: financeKeys.rates() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("fxTitle")}</DialogTitle>
          <DialogDescription>{t("fxDescription")}</DialogDescription>
        </DialogHeader>
        <form id="fx-form" onSubmit={submit} className="flex flex-col gap-3">
          {foreign.map((code) => (
            <div
              key={code}
              className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-3"
            >
              <Label htmlFor={`fx-${code}`} className="font-medium">
                1 {code}
              </Label>
              <div className="relative">
                <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                  Rp
                </span>
                <Input
                  id={`fx-${code}`}
                  inputMode="numeric"
                  placeholder={t("notSet")}
                  className="pl-9"
                  value={values[code] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [code]: cleanAmount(e.target.value, "IDR"),
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button type="submit" form="fx-form" disabled={saving}>
            {saving ? tc("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
