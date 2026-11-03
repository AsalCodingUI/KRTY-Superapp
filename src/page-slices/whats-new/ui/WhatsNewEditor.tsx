"use client"

import {
  deleteWhatsNewEntry,
  saveWhatsNewEntry,
  type WhatsNewInput,
} from "@/app/(main)/whats-new/actions"
import { siteConfig } from "@/app/siteConfig"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DateField } from "@/components/date-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { POLICY_FILES_FOLDER } from "@/page-slices/policies/model/data"
import { MarkdownDocEditor } from "@/page-slices/policies/ui/doc-editor-lazy"
import { uploadReportImage } from "@/page-slices/projects/ui/workspace/reports-data"
import { useT } from "@/shared/i18n/client"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ImagePlus, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { whatsNewKeys } from "../model/data"
import {
  WHATS_NEW_AREAS,
  WHATS_NEW_AUDIENCES,
  WHATS_NEW_SURFACES,
  WHATS_NEW_TAGS,
  type WhatsNewEntry,
} from "../model/types"
import { AREA_LABEL, TAG } from "./shared"

const HREF = siteConfig.baseLinks.whatsNew

/** Pictures go where the rules' do: report-images, the nil-UUID folder
 *  (stakeholders write it; migrations/policy_doc_files.sql). */
const uploadImage = (file: File, original = false) =>
  uploadReportImage(POLICY_FILES_FOLDER, file, original)

const AUDIENCE_LABEL = {
  everyone: "audienceEveryone",
  pm: "audiencePm",
  stakeholder: "audienceStakeholder",
} as const

const SURFACE_LABEL = {
  app: "surfaceApp",
  mac: "surfaceMac",
  client: "surfaceClient",
} as const

function draftOf(entry: WhatsNewEntry | null): WhatsNewInput {
  return {
    title: entry?.title ?? "",
    summary: entry?.summary ?? "",
    date: entry?.date ?? format(new Date(), "yyyy-MM-dd"),
    tags: entry?.tags ?? ["new"],
    area: entry?.area ?? "general",
    audience: entry?.audience ?? "everyone",
    surface: entry?.surface ?? "app",
    thumbnailUrl: entry?.thumbnailUrl ?? null,
    body: entry?.body ?? "",
    published: entry?.published ?? false,
  }
}

/**
 * Writing Yang baru (stakeholders): "Tulis update", "Ubah" and "Hapus" for
 * the list and the guide page. Returns the actions and the dialogs to
 * render once.
 */
export function useWhatsNewAdmin() {
  const t = useT("whatsNew")
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<{
    entry: WhatsNewEntry | null
    key: number
  } | null>(null)
  const [deleting, setDeleting] = useState<WhatsNewEntry | null>(null)
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: whatsNewKeys.all })

  const elements = (
    <>
      {editing && (
        <WhatsNewEditorDialog
          key={editing.key}
          entry={editing.entry}
          onClose={() => setEditing(null)}
          onSaved={async (id, created) => {
            await refresh()
            if (created) router.push(`${HREF}?entry=${encodeURIComponent(id)}`)
          }}
        />
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle", { title: deleting?.title ?? "" })}
        description={t("deleteDescription")}
        confirmText={t("deletePermanently")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={async () => {
          if (!deleting) return
          const result = await deleteWhatsNewEntry(deleting.id)
          if (!result.success) return void toast.error(result.error)
          toast.success(t("deleted"))
          setDeleting(null)
          await refresh()
          router.replace(HREF)
        }}
      />
    </>
  )

  return {
    create: () => setEditing({ entry: null, key: Date.now() }),
    edit: (entry: WhatsNewEntry) => setEditing({ entry, key: Date.now() }),
    remove: (entry: WhatsNewEntry) => setDeleting(entry),
    elements,
  }
}

function WhatsNewEditorDialog({
  entry,
  onClose,
  onSaved,
}: {
  entry: WhatsNewEntry | null
  onClose: () => void
  onSaved: (id: string, created: boolean) => Promise<void>
}) {
  const t = useT("whatsNew")
  const [form, setForm] = useState<WhatsNewInput>(() => draftOf(entry))
  const body = useRef(form.body)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [asking, setAsking] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const patch = (next: Partial<WhatsNewInput>) => {
    setForm((f) => ({ ...f, ...next }))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    const result = await saveWhatsNewEntry(entry?.id ?? null, {
      ...form,
      body: body.current,
    })
    setSaving(false)
    if (!result.success) return void toast.error(result.error)
    toast.success(entry ? t("saved") : t("created"))
    setDirty(false)
    onClose()
    await onSaved(result.data!.id, !entry)
  }

  const requestClose = () => (dirty ? setAsking(true) : onClose())

  const pickThumbnail = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      patch({ thumbnailUrl: await uploadImage(file) })
    } catch {
      toast.error(t("uploadFailed"))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) requestClose()
      }}
    >
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(60rem,94svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        <header className="border-border flex shrink-0 items-center gap-2 border-b px-4 py-3">
          <DialogTitle className="sr-only">
            {entry ? t("editEntry") : t("newEntry")}
          </DialogTitle>
          <input
            value={form.title}
            maxLength={160}
            placeholder={t("titlePlaceholder")}
            aria-label={t("fieldTitle")}
            onChange={(e) => patch({ title: e.target.value })}
            className="text-heading placeholder:text-muted-foreground/60 min-w-0 flex-1 border-0 bg-transparent text-lg font-medium shadow-none ring-0 outline-none focus:ring-0"
          />
          <label className="text-muted-foreground flex shrink-0 items-center gap-2 text-sm">
            <Switch
              checked={form.published}
              onCheckedChange={(v) => patch({ published: Boolean(v) })}
            />
            <span className="max-sm:hidden">{t("publish")}</span>
          </label>
          <Button
            size="sm"
            onClick={save}
            disabled={!form.title.trim() || saving || uploading}
          >
            {saving && <Spinner data-icon="inline-start" />}
            {t("save")}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("close")}
            onClick={requestClose}
          >
            <X />
          </Button>
        </header>

        <div className="scroll-pane flex min-h-0 flex-1 flex-col">
          {/* What the list shows, kept to two short rows above the guide:
              thumbnail + summary, then the details as compact pickers. */}
          <section className="border-border pane-px-4 sm:pane-px-6 flex flex-col gap-3 border-b py-3">
            <div className="flex gap-3">
              <div className="group/thumb border-border bg-muted dark:bg-muted/40 relative aspect-[2/1] w-32 shrink-0 overflow-hidden rounded-lg border sm:w-40">
                <button
                  type="button"
                  disabled={uploading}
                  aria-label={
                    form.thumbnailUrl
                      ? t("replaceThumbnail")
                      : t("uploadThumbnail")
                  }
                  title={t("thumbnailHint")}
                  onClick={() => fileRef.current?.click()}
                  className="text-muted-foreground hover:text-foreground flex size-full items-center justify-center gap-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  {form.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.thumbnailUrl}
                      alt=""
                      className="size-full object-cover object-center"
                    />
                  ) : uploading ? (
                    <Spinner />
                  ) : (
                    <>
                      <ImagePlus className="size-4" />
                      {t("fieldThumbnail")}
                    </>
                  )}
                </button>
                {form.thumbnailUrl && (
                  <Button
                    variant="secondary"
                    size="icon-xs"
                    aria-label={t("removeThumbnail")}
                    onClick={() => patch({ thumbnailUrl: null })}
                    className="absolute top-1 right-1 opacity-0 transition-opacity group-hover/thumb:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 />
                  </Button>
                )}
                {uploading && form.thumbnailUrl && (
                  <span className="bg-background/60 absolute inset-0 grid place-items-center">
                    <Spinner />
                  </span>
                )}
              </div>
              <Textarea
                id="wn-summary"
                rows={2}
                maxLength={400}
                value={form.summary}
                aria-label={t("fieldSummary")}
                placeholder={t("summaryPlaceholder")}
                onChange={(e) => patch({ summary: e.target.value })}
                className="min-h-0 flex-1 resize-none"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => {
                  void pickThumbnail(e.target.files?.[0])
                  e.target.value = ""
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateField
                id="wn-date"
                value={form.date}
                onChange={(date) => patch({ date })}
                className="h-8 w-auto"
              />
              <div
                role="group"
                aria-label={t("fieldTags")}
                className="flex items-center gap-1"
              >
                {WHATS_NEW_TAGS.map((tag) => {
                  const on = form.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        patch({
                          tags: on
                            ? form.tags.filter((x) => x !== tag)
                            : [...form.tags, tag],
                        })
                      }
                      className={cn(
                        "inline-flex h-8 items-center rounded-full border px-3 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                        on
                          ? "bg-foreground text-background border-transparent"
                          : "border-border text-foreground/80 hover:bg-foreground/[0.05]",
                      )}
                    >
                      {t(TAG[tag].label)}
                    </button>
                  )
                })}
              </div>
              <PickField
                label={t("fieldArea")}
                value={form.area}
                options={WHATS_NEW_AREAS.map((a) => ({
                  value: a,
                  label: t(AREA_LABEL[a]),
                }))}
                onChange={(area) => patch({ area })}
              />
              <PickField
                label={t("fieldAudience")}
                value={form.audience}
                options={WHATS_NEW_AUDIENCES.map((a) => ({
                  value: a,
                  label: t(AUDIENCE_LABEL[a]),
                }))}
                onChange={(audience) => patch({ audience })}
              />
              <PickField
                label={t("fieldSurface")}
                value={form.surface}
                options={WHATS_NEW_SURFACES.map((s) => ({
                  value: s,
                  label: t(SURFACE_LABEL[s]),
                }))}
                onChange={(surface) => patch({ surface })}
              />
              <span
                className="text-muted-foreground ml-auto cursor-help text-xs underline decoration-dotted underline-offset-2"
                title={`${t("publishHint")} ${t("bodyHint")}`}
              >
                {t("fieldTips")}
              </span>
            </div>
          </section>

          <MarkdownDocEditor
            value={form.body}
            ariaLabel={t("bodyLabel")}
            className="min-h-[28rem] flex-1"
            onChange={(markdown) => {
              body.current = markdown
              setDirty(true)
            }}
            onUploadImage={(file, original) => uploadImage(file, original)}
          />
        </div>
      </DialogContent>

      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title={t("unsavedTitle")}
        description={t("unsavedDescription")}
        confirmText={t("discard")}
        cancelText={t("cancel")}
        variant="destructive"
        onConfirm={() => onClose()}
      />
    </Dialog>
  )
}

/** A compact picker for the details row; its name is the trigger's label. */
function PickField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v as string)}>
      <SelectTrigger
        size="sm"
        aria-label={label}
        title={label}
        className="w-auto"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
