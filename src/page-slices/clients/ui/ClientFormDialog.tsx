"use client"

import { saveClient } from "@/app/(main)/clients/actions/client-actions"
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
import { CURRENCIES } from "@/entities/finance/lib/money"
import { useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { clientKeys, type ClientRow } from "../model/data"

/** Add or edit a client. `onSaved` gets the id (new clients included). */
export function ClientFormDialog({
  client,
  open,
  onOpenChange,
  onSaved,
}: {
  client: ClientRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (id: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <ClientForm
            client={client}
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

function ClientForm({
  client,
  onDone,
}: {
  client: ClientRow | null
  onDone: (id?: string) => void
}) {
  const t = useT("clients")
  const tc = useT("common")
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: client?.name ?? "",
    contactName: client?.contact_name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    website: client?.website ?? "",
    country: client?.country ?? "",
    address: client?.address ?? "",
    currency: client?.currency ?? "IDR",
    notes: client?.notes ?? "",
  })
  const [saving, setSaving] = useState(false)
  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = await saveClient(client?.id ?? null, form)
    setSaving(false)
    if (!result.success || !result.data) {
      toast.error(result.success ? t("errSave") : result.error)
      return
    }
    toast.success(client ? t("updated") : t("created"))
    queryClient.invalidateQueries({ queryKey: clientKeys.all })
    queryClient.invalidateQueries({ queryKey: ["projects"] })
    onDone(result.data.id)
  }

  const field = (
    key: keyof typeof form,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`client-${key}`}>{label}</Label>
      <Input
        id={`client-${key}`}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        {...props}
      />
    </div>
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>{client ? t("editTitle") : t("newTitle")}</DialogTitle>
        <DialogDescription>{t("formDescription")}</DialogDescription>
      </DialogHeader>
      <form id="client-form" onSubmit={submit} className="flex flex-col gap-4">
        {field("name", t("fieldName"), {
          required: true,
          autoFocus: true,
          maxLength: 120,
          placeholder: t("fieldNamePlaceholder"),
        })}
        <div className="grid grid-cols-2 gap-3">
          {field("contactName", t("fieldContact"), {
            maxLength: 120,
            placeholder: t("fieldContactPlaceholder"),
          })}
          {field("email", t("fieldEmail"), {
            type: "email",
            maxLength: 200,
            placeholder: "pic@client.com",
          })}
          {field("phone", t("fieldPhone"), {
            maxLength: 60,
            placeholder: "+62…",
          })}
          {field("website", t("fieldWebsite"), {
            maxLength: 200,
            placeholder: "client.com",
          })}
          {field("country", t("fieldCountry"), {
            maxLength: 80,
            placeholder: t("fieldCountryPlaceholder"),
          })}
          <div className="flex flex-col gap-2">
            <Label>{t("fieldCurrency")}</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => v && set("currency", v)}
            >
              <SelectTrigger className="w-full" aria-label={t("fieldCurrency")}>
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
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="client-address">{t("fieldAddress")}</Label>
          <Textarea
            id="client-address"
            rows={2}
            maxLength={500}
            value={form.address}
            placeholder={t("fieldAddressPlaceholder")}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="client-notes">
            {t("fieldNotes")}{" "}
            <span className="text-muted-foreground font-normal">
              ({tc("optional")})
            </span>
          </Label>
          <Textarea
            id="client-notes"
            rows={3}
            maxLength={2000}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onDone()}>
          {tc("cancel")}
        </Button>
        <Button type="submit" form="client-form" disabled={saving}>
          {saving ? tc("saving") : tc("save")}
        </Button>
      </DialogFooter>
    </>
  )
}
