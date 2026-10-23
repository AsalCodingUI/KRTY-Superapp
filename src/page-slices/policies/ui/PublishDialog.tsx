"use client"

import { DateField } from "@/components/date-field"
import { publishPolicy } from "@/app/(main)/policies/actions/policy-actions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/shared/i18n/client"
import { format } from "date-fns"
import { useState } from "react"
import { toast } from "sonner"

/**
 * Turns the draft into the next version. The first version needs no change
 * note; later ones do, so the history says what changed.
 */
export function PublishDialog({
  policyId,
  title,
  nextVersion,
  open,
  onOpenChange,
  onPublished,
}: {
  policyId: string
  title: string
  nextVersion: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onPublished: () => void
}) {
  const t = useT("policies")
  const tc = useT("common")
  const first = nextVersion === 1
  const [note, setNote] = useState("")
  const [effectiveAt, setEffectiveAt] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  )
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!first && !note.trim()) {
      toast.error(t("writeWhatChanged"))
      return
    }
    setSaving(true)
    const result = await publishPolicy(policyId, {
      changeSummary: note,
      effectiveAt,
      notify,
    })
    setSaving(false)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(
      first
        ? t("publishedToast", { title })
        : t("publishedChangesToast", { title }),
    )
    setNote("")
    onOpenChange(false)
    onPublished()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {first ? t("publishRule") : t("publishChanges")}
          </DialogTitle>
          <DialogDescription>
            {first ? t("publishFirstDescription") : t("publishNextDescription")}
          </DialogDescription>
        </DialogHeader>
        <form
          id="publish-policy-form"
          onSubmit={submit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="policy-note">
              {first ? t("whatChangedOptional") : t("whatChanged")}
            </Label>
            <Textarea
              id="policy-note"
              rows={3}
              maxLength={300}
              placeholder={
                first ? t("notePlaceholderFirst") : t("notePlaceholderNext")
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="policy-effective">{t("effectiveSinceLabel")}</Label>
            <DateField
              id="policy-effective"
              required
              value={effectiveAt}
              onChange={setEffectiveAt}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Checkbox
              checked={notify}
              onCheckedChange={(checked) => setNotify(checked === true)}
              className="mt-0.5"
            />
            <span>{t("notifyEveryone")}</span>
          </label>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button type="submit" form="publish-policy-form" disabled={saving}>
            {saving ? t("publishing") : t("publish")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
