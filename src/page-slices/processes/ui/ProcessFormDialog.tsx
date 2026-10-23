"use client"

import {
  createProcess,
  updateProcess,
} from "@/app/(main)/processes/actions/process-actions"
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useT } from "@/shared/i18n/client"
import { useState } from "react"
import { toast } from "sonner"
import { useRefreshProcesses, type Process } from "../model/data"

const BLANK = "__blank"

/**
 * New process (blank or copied from another) or renaming one. `copyFrom`
 * preselects the source, e.g. for "Duplicate".
 */
export function ProcessFormDialog({
  open,
  onOpenChange,
  process,
  copyFrom,
  processes,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Set to rename; null to create. */
  process: Process | null
  copyFrom?: Process | null
  processes: Process[]
  onSaved?: (id: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <ProcessForm
            process={process}
            copyFrom={copyFrom ?? null}
            processes={processes}
            onDone={(id) => {
              onOpenChange(false)
              if (id) onSaved?.(id)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProcessForm({
  process,
  copyFrom,
  processes,
  onDone,
}: {
  process: Process | null
  copyFrom: Process | null
  processes: Process[]
  onDone: (id?: string) => void
}) {
  const t = useT("processes")
  const tc = useT("common")
  const refresh = useRefreshProcesses()
  const [name, setName] = useState(
    process?.name ?? (copyFrom ? t("copyOf", { name: copyFrom.name }) : ""),
  )
  const [description, setDescription] = useState(
    process?.description ?? copyFrom?.description ?? "",
  )
  const [source, setSource] = useState(copyFrom?.id ?? BLANK)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = process
      ? await updateProcess(process.id, { name, description })
      : await createProcess({
          name,
          description,
          copyFrom: source === BLANK ? null : source,
        })
    setSaving(false)
    if (!result.success) return void toast.error(result.error)
    toast.success(process ? t("saved") : t("created"))
    refresh()
    onDone(process?.id ?? (result.data as { id: string } | undefined)?.id)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{process ? t("editTitle") : t("newTitle")}</DialogTitle>
        {!process && (
          <DialogDescription>{t("newDescription")}</DialogDescription>
        )}
      </DialogHeader>
      <form id="process-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="process-name">{t("fieldName")}</Label>
          <Input
            id="process-name"
            required
            autoFocus
            maxLength={80}
            value={name}
            placeholder={t("fieldNamePlaceholder")}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="process-description">
            {t("fieldDescription")}{" "}
            <span className="text-muted-foreground font-normal">
              ({tc("optional")})
            </span>
          </Label>
          <Textarea
            id="process-description"
            rows={2}
            maxLength={500}
            value={description}
            placeholder={t("fieldDescriptionPlaceholder")}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        {!process && processes.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>{t("fieldCopyFrom")}</Label>
            <Select value={source} onValueChange={(v) => v && setSource(v)}>
              <SelectTrigger className="w-full" aria-label={t("fieldCopyFrom")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BLANK}>{t("startBlank")}</SelectItem>
                <SelectSeparator />
                {processes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onDone()}>
          {tc("cancel")}
        </Button>
        <Button type="submit" form="process-form" disabled={saving}>
          {saving ? tc("saving") : tc("save")}
        </Button>
      </DialogFooter>
    </>
  )
}
