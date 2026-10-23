"use client"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { FileField } from "@/components/file-field"
import { SegmentedControl } from "@/components/segmented-control"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  defaultNotes,
  needsVerification,
  PAYMENT_FIELDS,
  PAYMENT_TYPE_LABEL,
  PAYMENT_TYPES,
  type AgencyProfile,
  type PaymentType,
} from "@/entities/finance/lib/invoice"
import { createClient } from "@/shared/api/supabase/client"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  dateStamp,
  slugify,
  splitFileName,
  uploadUnique,
} from "@/shared/lib/storage-names"
import { RiAddLine } from "@/shared/ui/lucide-icons"
import { useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { AlertTriangle, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  FINANCE_BUCKET,
  invoiceKeys,
  saveAgency,
  useAgency,
  usePaymentMethods,
  useQrUrl,
  type PaymentMethod,
} from "./data"

type Draft = Omit<PaymentMethod, "id" | "sort"> & { id: string | null }

const NEW_METHOD: Draft = {
  id: null,
  name: "",
  type: "bank",
  details: {},
  notes: defaultNotes("bank"),
  qr_path: null,
  verified_at: null,
  is_active: true,
}

/** Payment methods (bank, crypto, PayPal…) and the studio's printed profile. */
export function InvoiceSettingsDialog({
  open,
  onOpenChange,
  initialMethodId,
  initialTab = "methods",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Open straight on this method's form ("new" = a new method). */
  initialMethodId?: string | null
  initialTab?: "methods" | "studio"
}) {
  const t = useT("invoices")
  const [tab, setTab] = useState<"methods" | "studio">(initialTab)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(46rem,90svh)] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("settingsTitle")}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("settingsTitle")}
          </DialogDescription>
        </DialogHeader>
        <SegmentedControl
          fitContent
          className="self-start"
          value={tab}
          onChange={setTab}
          items={[
            { value: "methods", label: t("tabMethods") },
            { value: "studio", label: t("tabStudio") },
          ]}
        />
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
          {open &&
            (tab === "methods" ? (
              <MethodsTab initialMethodId={initialMethodId} />
            ) : (
              <StudioTab onDone={() => onOpenChange(false)} />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MethodsTab({ initialMethodId }: { initialMethodId?: string | null }) {
  const t = useT("invoices")
  const dateLocale = useDateLocale()
  const { data: methods = [] } = usePaymentMethods()
  const [draft, setDraft] = useState<Draft | null>(null)

  // Open the asked-for form once (not again when the list refetches).
  const opened = useRef(false)
  useEffect(() => {
    if (!initialMethodId || opened.current) return
    if (initialMethodId === "new") {
      opened.current = true
      return setDraft({ ...NEW_METHOD })
    }
    const m = methods.find((x) => x.id === initialMethodId)
    if (m) {
      opened.current = true
      setDraft({ ...m })
    }
  }, [initialMethodId, methods])

  if (draft) return <MethodForm draft={draft} onDone={() => setDraft(null)} />

  return (
    <div className="flex flex-col gap-2 pt-2">
      {methods.length === 0 && (
        <p className="text-muted-foreground py-6 text-center text-sm">
          {t("methodsEmpty")}
        </p>
      )}
      {methods.map((m) => {
        const stale = needsVerification(m)
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setDraft({ ...m })}
            className="hover:bg-muted/50 border-border flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn(
                  "truncate",
                  !m.is_active && "text-muted-foreground line-through",
                )}
              >
                {m.name}
              </span>
              <span className="text-muted-foreground truncate text-xs">
                {PAYMENT_TYPE_LABEL[m.type] ?? m.type}
                {m.type === "crypto" &&
                  ` · ${
                    m.verified_at
                      ? `${t("lastChecked")} ${formatDistanceToNow(new Date(m.verified_at), { addSuffix: true, locale: dateLocale })}`
                      : t("neverChecked")
                  }`}
              </span>
            </span>
            {stale && (
              <AlertTriangle className="text-warning size-4 shrink-0" />
            )}
            <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          </button>
        )
      })}
      <Button
        variant="outline"
        className="mt-1 self-start"
        onClick={() => setDraft({ ...NEW_METHOD })}
      >
        <RiAddLine data-icon="inline-start" />
        {t("addMethod")}
      </Button>
    </div>
  )
}

function MethodForm({
  draft: initial,
  onDone,
}: {
  draft: Draft
  onDone: () => void
}) {
  const t = useT("invoices")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<Draft>(initial)
  const [qrFile, setQrFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { data: qrUrl } = useQrUrl(qrFile ? null : draft.qr_path)
  const [localQr, setLocalQr] = useState<string | null>(null)
  useEffect(() => {
    if (!qrFile) return setLocalQr(null)
    const url = URL.createObjectURL(qrFile)
    setLocalQr(url)
    return () => URL.revokeObjectURL(url)
  }, [qrFile])
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: invoiceKeys.methods })

  const setType = (type: PaymentType) =>
    setDraft((d) => ({
      ...d,
      type,
      // Swap in the template's notes unless they were edited.
      notes:
        !d.notes || d.notes === defaultNotes(d.type, d.details)
          ? defaultNotes(type, d.details)
          : d.notes,
    }))
  const setField = (key: string, value: string) =>
    setDraft((d) => ({ ...d, details: { ...d.details, [key]: value } }))

  const save = async () => {
    if (!draft.name.trim()) return void toast.error(t("errMethod"))
    setSaving(true)
    try {
      const db = createClient()
      let qr_path = draft.qr_path
      if (qrFile) {
        const { ext } = splitFileName(qrFile.name)
        qr_path = await uploadUnique(
          db,
          FINANCE_BUCKET,
          "qr",
          `${slugify(draft.name, 40)}_${dateStamp()}`,
          ext || "png",
          qrFile,
        )
        if (draft.qr_path)
          await db.storage.from(FINANCE_BUCKET).remove([draft.qr_path])
      }
      const row = {
        name: draft.name.trim(),
        type: draft.type,
        details: draft.details,
        notes: draft.notes?.trim() || null,
        qr_path,
        verified_at: draft.verified_at,
        is_active: draft.is_active,
      }
      const { error } = draft.id
        ? await db.from("payment_methods").update(row).eq("id", draft.id)
        : await db.from("payment_methods").insert(row)
      if (error) throw error
      toast.success(t("methodSaved"))
      await refresh()
      onDone()
    } catch {
      toast.error(t("errMethod"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pm-name">{t("methodName")}</Label>
          <Input
            id="pm-name"
            autoFocus={!draft.id}
            value={draft.name}
            placeholder={t("methodNamePlaceholder")}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("methodType")}</Label>
          <Select
            value={draft.type}
            onValueChange={(v) => v && setType(v as PaymentType)}
          >
            <SelectTrigger className="w-full" aria-label={t("methodType")}>
              <SelectValue>
                {(v: PaymentType) => PAYMENT_TYPE_LABEL[v]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {PAYMENT_TYPE_LABEL[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {PAYMENT_FIELDS[draft.type].length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_FIELDS[draft.type].map((f) => (
            <div
              key={f.key}
              className={cn(
                "flex flex-col gap-1.5",
                ["address", "bank_address", "details", "link"].includes(
                  f.key,
                ) && "sm:col-span-2",
              )}
            >
              <Label htmlFor={`pm-${f.key}`}>{f.label}</Label>
              <Input
                id={`pm-${f.key}`}
                value={draft.details[f.key] ?? ""}
                className={
                  f.key === "address" ? "font-mono text-xs" : undefined
                }
                onChange={(e) => setField(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {draft.type === "crypto" && (
        <div className="border-border flex flex-col gap-3 rounded-xl border p-3">
          <div className="flex items-start gap-3">
            <div className="bg-muted grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg">
              {(localQr || qrUrl) && (
                // eslint-disable-next-line @next/next/no-img-element -- local or signed URL
                <img
                  src={localQr ?? qrUrl}
                  alt="QR"
                  className="size-full object-contain"
                />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Label>{t("qr")}</Label>
              <FileField
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                fileName={qrFile?.name}
                onChange={(files) => setQrFile(files?.[0] ?? null)}
              />
              {draft.qr_path && !qrFile && (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive w-fit text-xs"
                  onClick={() => setDraft({ ...draft, qr_path: null })}
                >
                  {t("removeQr")}
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span
              className={cn(
                "text-muted-foreground",
                needsVerification(draft) && "text-warning",
              )}
            >
              {draft.verified_at
                ? `${t("lastChecked")} ${formatDistanceToNow(new Date(draft.verified_at), { addSuffix: true, locale: dateLocale })}`
                : t("neverChecked")}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraft({ ...draft, verified_at: new Date().toISOString() })
              }
            >
              {t("markChecked")}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pm-notes">{t("methodNotes")}</Label>
        <Textarea
          id="pm-notes"
          rows={4}
          value={draft.notes ?? ""}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={draft.is_active}
          onCheckedChange={(v) => setDraft({ ...draft, is_active: Boolean(v) })}
        />
        {t("methodActive")}
      </label>

      <DialogFooter className="sm:justify-between">
        {draft.id ? (
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleting(true)}
          >
            {t("deleteMethod")}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDone}>
            {tc("cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? tc("saving") : tc("save")}
          </Button>
        </div>
      </DialogFooter>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("deleteMethodTitle", { name: draft.name })}
        description={t("deleteMethodDescription")}
        confirmText={t("deleteMethod")}
        cancelText={tc("cancel")}
        variant="destructive"
        onConfirm={async () => {
          const db = createClient()
          const { error } = await db
            .from("payment_methods")
            .delete()
            .eq("id", draft.id!)
          if (error) return void toast.error(t("errMethod"))
          if (draft.qr_path)
            await db.storage.from(FINANCE_BUCKET).remove([draft.qr_path])
          toast.success(t("methodDeleted"))
          await refresh()
          onDone()
        }}
      />
    </div>
  )
}

function StudioTab({ onDone }: { onDone: () => void }) {
  const t = useT("invoices")
  const tc = useT("common")
  const queryClient = useQueryClient()
  const { data: agency } = useAgency()
  const [form, setForm] = useState<AgencyProfile | null>(null)
  useEffect(() => {
    if (agency && !form) setForm(agency)
  }, [agency, form])
  if (!form) return null

  const field = (key: keyof AgencyProfile, label: string, area = false) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`studio-${key}`}>{label}</Label>
      {area ? (
        <Textarea
          id={`studio-${key}`}
          rows={3}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <Input
          id={`studio-${key}`}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", t("studioName"))}
        {field("tagline", t("studioTagline"))}
      </div>
      {field("email", t("studioEmail"))}
      {field("address", t("studioAddress"), true)}
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          {tc("cancel")}
        </Button>
        <Button
          onClick={async () => {
            try {
              await saveAgency(form)
              toast.success(t("studioSaved"))
              await queryClient.invalidateQueries({
                queryKey: invoiceKeys.agency,
              })
              onDone()
            } catch {
              toast.error(t("errMethod"))
            }
          }}
        >
          {tc("save")}
        </Button>
      </DialogFooter>
    </div>
  )
}
