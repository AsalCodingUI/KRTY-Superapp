"use client"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
      toast.error("Tulis apa yang berubah di versi ini.")
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
      first ? `${title} diterbitkan` : `Perubahan ${title} diterbitkan`,
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
            {first ? "Terbitkan aturan" : "Terbitkan perubahan"}
          </DialogTitle>
          <DialogDescription>
            {first
              ? "Setelah terbit, aturan ini bisa dibaca semua karyawan."
              : "Versi sebelumnya tetap tersimpan di riwayat."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="publish-policy-form"
          onSubmit={submit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="policy-note">
              Apa yang berubah{first && " (opsional)"}
            </Label>
            <Textarea
              id="policy-note"
              rows={3}
              maxLength={300}
              placeholder={
                first
                  ? "Misalnya: aturan pertama untuk cuti melahirkan."
                  : "Misalnya: cuti melahirkan jadi 3 bulan."
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="policy-effective">Berlaku sejak</Label>
            <Input
              id="policy-effective"
              type="date"
              required
              value={effectiveAt}
              onChange={(e) => setEffectiveAt(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Checkbox
              checked={notify}
              onCheckedChange={(checked) => setNotify(checked === true)}
              className="mt-0.5"
            />
            <span>Kirim notifikasi ke semua karyawan</span>
          </label>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>
          <Button type="submit" form="publish-policy-form" disabled={saving}>
            {saving ? "Menerbitkan…" : "Terbitkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
