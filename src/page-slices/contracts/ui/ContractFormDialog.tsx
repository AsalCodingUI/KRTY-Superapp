"use client"

import { DateField } from "@/components/date-field"
import {
  FileDropCanvas,
  twoPaneDialogClassName,
  twoPanePanelClassName,
} from "@/components/file-drop-canvas"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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
import { useT } from "@/shared/i18n/client"
import { splitFileName } from "@/shared/lib/storage-names"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import {
  CONTRACT_KINDS,
  contractKeys,
  KIND_LABEL_KEYS,
  removeContractFile,
  supabase,
  uploadContractFile,
  useContractFileUrl,
  useContractPeople,
  type ContractKind,
  type ContractRow,
} from "../model/data"

const MAX_BYTES = 25 * 1024 * 1024

/** Upload a finished contract PDF, or edit one (stakeholders). */
export function ContractFormDialog({
  contract,
  defaultUserId,
  open,
  onOpenChange,
}: {
  contract: ContractRow | null
  /** Preselects the employee (the page's current filter). */
  defaultUserId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Invoice-editor layout: the PDF on the left, the details on the right. */}
      <DialogContent
        bare
        showCloseButton={false}
        className={twoPaneDialogClassName}
      >
        {open && (
          <ContractForm
            contract={contract}
            defaultUserId={defaultUserId ?? null}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ContractForm({
  contract,
  defaultUserId,
  onDone,
}: {
  contract: ContractRow | null
  defaultUserId: string | null
  onDone: () => void
}) {
  const t = useT("contracts")
  const tc = useT("common")
  const queryClient = useQueryClient()
  const { data: people = [] } = useContractPeople()
  const [form, setForm] = useState({
    userId: contract?.user_id ?? defaultUserId ?? "",
    title: contract?.title ?? "",
    kind: (contract?.kind ?? "pkwt") as ContractKind,
    startDate: contract?.start_date ?? "",
    endDate: contract?.end_date ?? "",
    hasEmaterai: contract?.has_ematerai ?? true,
    draft: contract?.status === "draft",
    notes: contract?.notes ?? "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const { data: storedUrl } = useContractFileUrl(
    file ? null : (contract?.file_path ?? null),
  )
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))
  // Drafts can still be sent; a sent contract can't go back to draft.
  const canDraft = !contract || contract.status === "draft"

  const pickFile = (files: FileList | null) => {
    const next = files?.[0] ?? null
    if (!next) return setFile(null)
    const isPdf =
      next.type === "application/pdf" || splitFileName(next.name).ext === "pdf"
    if (!isPdf) return void toast.error(t("errPdf"))
    if (next.size > MAX_BYTES) return void toast.error(t("errFileTooLarge"))
    setFile(next)
    // A fresh upload usually carries its title in the file name.
    if (!form.title.trim()) set("title", splitFileName(next.name).base)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = form.title.trim()
    if (!form.userId || !title || !form.startDate || (!contract && !file)) {
      toast.error(t("errRequired"))
      return
    }
    if (form.endDate && form.endDate < form.startDate) {
      toast.error(t("errEndBeforeStart"))
      return
    }
    setSaving(true)
    const person = people.find((p) => p.id === form.userId)
    let uploaded: string | null = null
    try {
      if (file)
        uploaded = await uploadContractFile(
          form.userId,
          person?.full_name ?? contract?.person?.full_name ?? null,
          title,
          file,
        )
      const values = {
        title,
        kind: form.kind,
        start_date: form.startDate,
        end_date: form.endDate || null,
        has_ematerai: form.hasEmaterai,
        notes: form.notes.trim() || null,
        ...(canDraft ? { status: form.draft ? "draft" : "sent" } : {}),
        ...(uploaded ? { file_path: uploaded } : {}),
      }
      const { error } = contract
        ? await supabase()
            .from("employee_contracts")
            .update(values)
            .eq("id", contract.id)
        : await supabase()
            .from("employee_contracts")
            .insert({ ...values, user_id: form.userId, file_path: uploaded! })
      if (error) throw error
      // The old PDF is replaced; drop it from storage.
      if (contract && uploaded)
        await removeContractFile(contract.file_path).catch(() => undefined)
    } catch {
      if (uploaded) await removeContractFile(uploaded).catch(() => undefined)
      setSaving(false)
      toast.error(t("errSave"))
      return
    }
    setSaving(false)
    toast.success(contract ? t("updated") : t("created"))
    queryClient.invalidateQueries({ queryKey: contractKeys.all })
    onDone()
  }

  return (
    <>
      <FileDropCanvas
        file={file}
        storedUrl={storedUrl}
        storedName={contract ? `${contract.title}.pdf` : null}
        accept="application/pdf,.pdf"
        labels={{
          title: t("dropTitle"),
          hint: t("dropHint"),
          active: t("dropActive"),
          replace: t("fieldFileReplace"),
          remove: t("removeFile"),
        }}
        replaceHint={
          contract?.status === "acknowledged" ? t("fieldFileReplaceHint") : null
        }
        onPick={pickFile}
        onClear={() => setFile(null)}
      />

      <aside className={twoPanePanelClassName}>
        <div className="shrink-0 px-5 pt-5 pb-3">
          <DialogTitle className="text-heading text-xl font-normal tracking-tight">
            {contract ? t("editTitle") : t("newTitle")}
          </DialogTitle>
        </div>
        <form
          id="contract-form"
          onSubmit={submit}
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1 pb-5"
        >
          <div className="flex flex-col gap-2">
            <Label>{t("fieldEmployee")}</Label>
            {/* The file lives in the person's folder, so it stays theirs. */}
            <Select
              value={form.userId || null}
              onValueChange={(v) => v && set("userId", v)}
              disabled={Boolean(contract)}
            >
              <SelectTrigger className="w-full" aria-label={t("fieldEmployee")}>
                <SelectValue>
                  {(v: string | null) =>
                    v ? (
                      (people.find((p) => p.id === v)?.full_name ??
                      contract?.person?.full_name ??
                      "")
                    ) : (
                      <span className="text-tertiary-foreground">
                        {t("pickEmployee")}
                      </span>
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {people.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name ?? p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_10rem] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contract-title">{t("fieldTitle")}</Label>
              <Input
                id="contract-title"
                required
                maxLength={160}
                value={form.title}
                placeholder={t("fieldTitlePlaceholder")}
                onChange={(e) => set("title", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("fieldKind")}</Label>
              <Select
                value={form.kind}
                onValueChange={(v) => v && set("kind", v as ContractKind)}
              >
                <SelectTrigger className="w-full" aria-label={t("fieldKind")}>
                  <SelectValue>
                    {(v: ContractKind) => t(KIND_LABEL_KEYS[v])}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      {t(KIND_LABEL_KEYS[k])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contract-start">{t("fieldStart")}</Label>
              <DateField
                id="contract-start"
                required
                value={form.startDate}
                onChange={(v) => set("startDate", v)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="contract-end">
                {t("fieldEnd")}{" "}
                <span className="text-muted-foreground font-normal">
                  ({tc("optional")})
                </span>
              </Label>
              <DateField
                id="contract-end"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(v) => set("endDate", v)}
              />
            </div>
            <p className="text-muted-foreground col-span-2 -mt-1 text-[13px]">
              {t("fieldEndHint")}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={form.hasEmaterai}
                onCheckedChange={(checked) =>
                  set("hasEmaterai", checked === true)
                }
              />
              <span>{t("fieldEmaterai")}</span>
            </label>
            {canDraft && (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <Checkbox
                  checked={form.draft}
                  onCheckedChange={(checked) => set("draft", checked === true)}
                />
                <span>{t("fieldDraft")}</span>
              </label>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="contract-notes">
              {t("fieldNotes")}{" "}
              <span className="text-muted-foreground font-normal">
                ({tc("optional")})
              </span>
            </Label>
            <Textarea
              id="contract-notes"
              rows={2}
              maxLength={2000}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </form>
        <footer className="border-border flex shrink-0 items-center justify-end gap-2 border-t px-4 py-3">
          <Button type="button" variant="outline" onClick={onDone}>
            {tc("cancel")}
          </Button>
          <Button type="submit" form="contract-form" disabled={saving}>
            {saving && <Spinner data-icon="inline-start" />}
            {saving ? tc("saving") : contract ? tc("save") : t("upload")}
          </Button>
        </footer>
      </aside>
    </>
  )
}
