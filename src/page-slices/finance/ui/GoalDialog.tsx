"use client"

import { setFinanceGoal } from "@/app/(main)/finance/actions/subscription-actions"
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
import { useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { financeKeys } from "../model/data"

/** Set or clear the income goal for a year. */
export function GoalDialog({
  year,
  current,
  open,
  onOpenChange,
}: {
  year: number
  current: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("finance")
  const tc = useT("common")
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState(current ? String(current) : "")
  const [saving, setSaving] = useState(false)

  const save = async (value: number | null) => {
    setSaving(true)
    const result = await setFinanceGoal(year, value)
    setSaving(false)
    if (!result.success) return toast.error(result.error)
    toast.success(value ? t("goalSaved", { year }) : t("goalDeleted", { year }))
    queryClient.invalidateQueries({ queryKey: financeKeys.goal(year) })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setAmount(current ? String(current) : "")
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("goalTitle", { year })}</DialogTitle>
        </DialogHeader>
        <form
          id="goal-form"
          onSubmit={(e) => {
            e.preventDefault()
            void save(Number(amount))
          }}
          className="flex flex-col gap-2"
        >
          <Label htmlFor="goal-amount">{t("goalLabel")}</Label>
          <Input
            id="goal-amount"
            autoFocus
            required
            inputMode="numeric"
            placeholder="500000000"
            value={amount}
            onChange={(e) =>
              setAmount(
                e.target.value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, ""),
              )
            }
          />
        </form>
        <DialogFooter>
          {current && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive mr-auto"
              disabled={saving}
              onClick={() => void save(null)}
            >
              {t("deleteGoal")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button type="submit" form="goal-form" disabled={saving || !amount}>
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
