"use client"

import { orEmpty } from "@/components/empty-value"
import { ListChip } from "@/components/grouped-list"
import { PdfPages } from "@/components/pdf-view"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useDateLocale, useT } from "@/shared/i18n/client"
import {
  RiCheckboxCircleFill,
  RiCloseLine,
  RiDownloadLine,
  RiFileTextLine,
  RiPencilLine,
} from "@/shared/ui/lucide-icons"
import { useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { AnimatePresence, m } from "motion/react"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import {
  contractKeys,
  downloadContract,
  kindLabelKey,
  supabase,
  useContractFileUrl,
  type ContractRow,
} from "../model/data"
import {
  EndingChip,
  StatusBadge,
  usePeriodLabel,
  type ContractViewer,
} from "./parts"

const EASE = [0.23, 1, 0.32, 1] as const

/** Lower-cased, single-spaced: "  Rico  Pratama" matches "rico pratama". */
const normalizeName = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLowerCase()

/**
 * One contract: the PDF on the left, details and the acknowledgement on the
 * right (stacked on phones).
 */
export function ContractDialog({
  contract,
  viewer,
  onEdit,
  onClose,
}: {
  contract: ContractRow
  viewer: ContractViewer
  onEdit: () => void
  onClose: () => void
}) {
  const t = useT("contracts")
  const tc = useT("common")
  const period = usePeriodLabel()
  const { data: url, isError } = useContractFileUrl(contract.file_path)
  const [failed, setFailed] = useState(false)
  const markFailed = useCallback(() => setFailed(true), [])

  const details: [string, React.ReactNode][] = [
    ...(viewer.isAdmin
      ? ([[t("fieldEmployeeLabel"), contract.person?.full_name]] as [
          string,
          React.ReactNode,
        ][])
      : []),
    [t("fieldKindLabel"), t(kindLabelKey(contract.kind))],
    [
      t("fieldPeriod"),
      <span key="period" className="flex flex-wrap items-center gap-1.5">
        {period(contract)}
        <EndingChip contract={contract} />
      </span>,
    ],
    [
      t("ematerai"),
      contract.has_ematerai ? (
        <span className="inline-flex items-center gap-1.5">
          <RiCheckboxCircleFill className="text-success-ink size-3.5" />
          {t("ematerai")}
        </span>
      ) : null,
    ],
    [t("fieldNotesLabel"), contract.notes],
  ]

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(52rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b pr-3 pl-5">
          <RiFileTextLine className="text-muted-foreground size-4 shrink-0" />
          <DialogTitle className="min-w-0 truncate text-sm font-medium">
            {contract.title}
          </DialogTitle>
          <span className="hidden shrink-0 sm:inline-flex">
            <StatusBadge status={contract.status} />
          </span>
          <div className="ml-auto flex items-center gap-1">
            {viewer.isAdmin && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <RiPencilLine data-icon="inline-start" />
                {t("edit")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={tc("download")}
              title={tc("download")}
              className="text-muted-foreground"
              onClick={() =>
                downloadContract(contract.file_path, contract.title).catch(() =>
                  toast.error(t("previewFailed")),
                )
              }
            >
              <RiDownloadLine />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("close")}
              className="text-muted-foreground"
              onClick={onClose}
            >
              <RiCloseLine />
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <div className="bg-popover relative flex h-[60svh] shrink-0 items-center justify-center md:h-auto md:min-w-0 md:flex-1">
            {isError || failed ? (
              <p className="text-muted-foreground px-6 text-center text-sm">
                {t("previewFailed")}
              </p>
            ) : !url ? (
              <Spinner className="size-6" />
            ) : (
              <PdfPages url={url} onError={markFailed} />
            )}
          </div>

          <aside className="border-border flex shrink-0 flex-col gap-5 border-t p-5 md:w-80 md:overflow-y-auto md:border-t-0 md:border-l">
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-medium">
                {t("details")}
              </h3>
              <dl className="flex flex-col gap-2.5 text-[13px]">
                {details.map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <dt className="text-tertiary-foreground">{label}</dt>
                    <dd className="text-foreground break-words whitespace-pre-line">
                      {orEmpty(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <Acknowledgement contract={contract} viewer={viewer} />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Acknowledgement({
  contract,
  viewer,
}: {
  contract: ContractRow
  viewer: ContractViewer
}) {
  const t = useT("contracts")
  const dateLocale = useDateLocale()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const own = contract.user_id === viewer.id
  const canAck = own && contract.status === "sent"
  // Must be the name on the profile when there is one.
  const mismatch =
    Boolean(viewer.name) &&
    name.trim() !== "" &&
    normalizeName(name) !== normalizeName(viewer.name!)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || mismatch) return
    setSaving(true)
    const { error } = await supabase().rpc("acknowledge_contract", {
      contract_id: contract.id,
      typed_name: name.trim(),
    })
    setSaving(false)
    if (error) {
      toast.error(t("errAck"))
      return
    }
    toast.success(t("ackDone"))
    queryClient.invalidateQueries({ queryKey: contractKeys.all })
  }

  const state =
    contract.status === "acknowledged"
      ? "done"
      : canAck
        ? "form"
        : contract.status === "draft"
          ? "draft"
          : "waiting"

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.section
        key={state}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="flex flex-col gap-2"
      >
        {state === "done" ? (
          <div className="bg-success-subtle text-green-11 flex items-start gap-2 rounded-2xl px-3.5 py-3 text-[13px]">
            <RiCheckboxCircleFill className="mt-0.5 size-4 shrink-0" />
            <span>
              {t("ackBy", {
                name: contract.acknowledged_name ?? "",
                date: contract.acknowledged_at
                  ? format(
                      parseISO(contract.acknowledged_at),
                      "d MMM yyyy, HH:mm",
                      {
                        locale: dateLocale,
                      },
                    )
                  : "",
              })}
            </span>
          </div>
        ) : state === "form" ? (
          <form
            onSubmit={submit}
            className="border-border flex flex-col gap-3 rounded-2xl border p-4"
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor="contract-ack-name" className="font-medium">
                {t("ackTitle")}
              </Label>
              <p className="text-muted-foreground text-[13px]">
                {t("ackDescription")}
              </p>
            </div>
            <Input
              id="contract-ack-name"
              autoComplete="name"
              placeholder={viewer.name ?? t("ackPlaceholder")}
              value={name}
              maxLength={160}
              aria-invalid={mismatch || undefined}
              onChange={(e) => setName(e.target.value)}
            />
            {mismatch && (
              <p className="text-destructive text-[13px]">{t("ackMismatch")}</p>
            )}
            <Button type="submit" disabled={saving || !name.trim() || mismatch}>
              {saving ? t("ackSubmitting") : t("ackSubmit")}
            </Button>
          </form>
        ) : (
          <ListChip className="h-auto py-1.5 whitespace-normal">
            {state === "draft" ? t("ackDraft") : t("ackWaiting")}
          </ListChip>
        )}
      </m.section>
    </AnimatePresence>
  )
}
