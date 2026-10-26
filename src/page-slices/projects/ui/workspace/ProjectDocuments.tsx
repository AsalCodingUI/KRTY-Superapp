"use client"

import { compressImage, isCompressible } from "@/shared/lib/compress-image"
import { Switch } from "@/components/ui/switch"
import {
  FileDropCanvas,
  twoPaneDialogClassName,
  twoPanePanelClassName,
} from "@/components/file-drop-canvas"
import { Chip, FilePreview } from "./FilePreview"
import { RowMenu, Section, type RowMenuItem } from "./ProjectLibrary"
import type { ViewerItem } from "@/components/file-viewer"
import { useFileDrop } from "@/shared/hooks/useFileDrop"
import { PageHeader } from "@/components/page-header"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import { RiAddLine, RiFileTextLine } from "@/shared/ui/lucide-icons"
import { useDateLocale, useT } from "@/shared/i18n/client"
import { format } from "date-fns"
import { FileText, Upload } from "@/components/icons"
import { FileSignature, Files } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  BUCKET,
  formatBytes,
  openProjectFile,
  supabase,
  uploadProjectFile,
  useDocuments,
  useFileUrl,
  useInvalidate,
  useViewer,
  useWorkspace,
  type DocumentRow,
} from "./data"
import dynamic from "next/dynamic"

// Viewer (PDF / office renderers) loads in its own chunk.
const FileViewer = dynamic(
  () => import("@/components/file-viewer").then((m) => m.FileViewer),
  { ssr: false },
)

export const KINDS = {
  proposal: { labelKey: "docKindProposal", icon: FileText },
  contract: { labelKey: "docKindContract", icon: FileSignature },
  other: { labelKey: "docKindOther", icon: Files },
} as const

export const STATUSES = {
  draft: {
    labelKey: "docStatusDraft",
    tone: "text-muted-foreground",
    dot: "bg-warning",
  },
  sent: { labelKey: "docStatusSent", tone: "text-info", dot: "bg-info" },
  approved: {
    labelKey: "docStatusApproved",
    tone: "text-success-ink",
    dot: "bg-success",
  },
  signed: {
    labelKey: "docStatusSigned",
    tone: "text-success-ink",
    dot: "bg-success",
  },
} as const

export type Kind = keyof typeof KINDS
export type Status = keyof typeof STATUSES
type Draft = {
  /** Set when editing an existing document. */
  id?: string
  kind: Kind
  title: string
  status: Status
  /** A new file to upload (replaces the current one when editing). */
  file: File | null
  /** Upload a picture as it is, without compressing it. */
  keepOriginal?: boolean
  /** Name of the file already attached (editing). */
  currentFile?: string | null
  /** Storage path of that file, for the preview. */
  currentPath?: string | null
}

const NEW_DRAFT: Draft = {
  kind: "proposal",
  title: "",
  status: "draft",
  file: null,
}

const titleFromFile = (file: File) => file.name.replace(/\.[^.]+$/, "")

/** Proposals, contracts and other files for the project, each with a status. */
export function ProjectDocuments({ projectId }: { projectId: string }) {
  const t = useT("projects")
  const tc = useT("common")
  const dateLocale = useDateLocale()
  const { data: documents = [], isLoading } = useDocuments(projectId)
  const viewer = useViewer()
  const invalidate = useInvalidate(projectId)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<DocumentRow | null>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const { data: workspace } = useWorkspace(projectId)
  const projectName = workspace?.project?.name ?? "project"
  const { data: storedUrl } = useFileUrl(
    draft && !draft.file ? draft.currentPath : null,
  )

  const save = async () => {
    if (!draft) return
    if (!draft.title.trim()) {
      toast.error(t("errDocTitleRequired"))
      return
    }
    setSaving(true)
    try {
      const db = supabase()
      // Pictures are compressed first (unless kept original).
      const file =
        draft.file && !draft.keepOriginal
          ? await compressImage(draft.file)
          : draft.file
      const path = file
        ? await uploadProjectFile(projectId, projectName, "documents", file)
        : null
      const fileFields = file
        ? {
            file_path: path,
            file_name: file.name,
            file_size: file.size,
          }
        : {}
      if (draft.id) {
        const previous = documents.find((d) => d.id === draft.id)
        const { error } = await db
          .from("project_documents")
          .update({
            kind: draft.kind,
            title: draft.title.trim(),
            status: draft.status,
            ...fileFields,
            updated_at: new Date().toISOString(),
          })
          .eq("id", draft.id)
        if (error) throw error
        // The replaced file isn't needed anymore.
        if (draft.file && previous?.file_path)
          await db.storage.from(BUCKET).remove([previous.file_path])
        toast.success(t("docSaved"))
      } else {
        const { error } = await db.from("project_documents").insert({
          project_id: projectId,
          kind: draft.kind,
          title: draft.title.trim(),
          status: draft.status,
          file_path: path,
          file_name: file?.name ?? null,
          file_size: file?.size ?? null,
          created_by: viewer.id,
        })
        if (error) throw error
        toast.success(t("docAdded"))
      }
      setDraft(null)
      invalidate("documents")
    } catch {
      toast.error(t("errSaveDoc"))
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (doc: DocumentRow, status: Status) => {
    const { error } = await supabase()
      .from("project_documents")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", doc.id)
    if (error) toast.error(t("errChangeStatus"))
    invalidate("documents")
  }

  // Documents with a file, in the order they're shown, for the viewer.
  const ordered = (Object.keys(KINDS) as Kind[]).flatMap((kindKey) =>
    documents.filter((d) =>
      kindKey === "other"
        ? !(d.kind in KINDS) || d.kind === "other"
        : d.kind === kindKey,
    ),
  )
  const withFile = ordered.filter((d) => d.file_path)
  const signed = async (path: string, download?: string) => {
    const { data: link, error } = await supabase()
      .storage.from(BUCKET)
      .createSignedUrl(path, 60 * 60, download ? { download } : undefined)
    if (error || !link) throw error ?? new Error("no url")
    return link.signedUrl
  }
  const viewerItems: ViewerItem[] = withFile.map((doc) => ({
    key: doc.id,
    name: doc.file_name ?? doc.title,
    meta: `${doc.title} · ${formatBytes(doc.file_size)}`,
    getUrl: () => signed(doc.file_path!),
    getDownloadUrl: () => signed(doc.file_path!, doc.file_name ?? doc.title),
  }))
  const open = (doc: DocumentRow) => {
    const index = withFile.findIndex((d) => d.id === doc.id)
    if (index >= 0) setViewing(index)
  }
  const edit = (doc: DocumentRow) =>
    setDraft({
      id: doc.id,
      kind: (doc.kind in KINDS ? doc.kind : "other") as Kind,
      title: doc.title,
      status: (doc.status in STATUSES ? doc.status : "draft") as Status,
      file: null,
      currentFile: doc.file_name,
      currentPath: doc.file_path,
    })

  const docMenu = (doc: DocumentRow): RowMenuItem[] => [
    ...(doc.file_path
      ? [
          { label: t("libOpen"), onSelect: () => open(doc) },
          {
            label: t("libDownload"),
            onSelect: () =>
              openProjectFile(doc.file_path!, doc.file_name ?? doc.title).catch(
                () => toast.error(t("errDownload")),
              ),
          },
        ]
      : []),
    ...(viewer.isAdmin
      ? [
          { label: t("actionEdit"), onSelect: () => edit(doc) },
          ...(Object.keys(STATUSES) as Status[]).map((st, i) => ({
            label: t(STATUSES[st].labelKey),
            checked: doc.status === st,
            separatorBefore: i === 0,
            onSelect: () => setStatus(doc, st),
          })),
          {
            label: tc("delete"),
            destructive: true,
            separatorBefore: true,
            onSelect: () => setDeleting(doc),
          },
        ]
      : []),
  ]

  // Drop a file anywhere on the page to start a new document with it.
  const drop = useFileDrop((files) => {
    const file = files[0]
    if (!file) return
    setDraft({ ...NEW_DRAFT, file, title: titleFromFile(file) })
  }, viewer.isAdmin && !draft)

  return (
    <div className="relative flex flex-col" {...drop.bind}>
      {drop.dragging && (
        <div className="bg-primary/5 border-primary/40 pointer-events-none fixed inset-0 z-40 m-3 flex items-center justify-center rounded-2xl border-2 border-dashed backdrop-blur-[1px]">
          <span className="bg-background flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-(--elev-4)">
            <Upload className="size-4" />
            {tc("dropToUpload")}
          </span>
        </div>
      )}
      <PageHeader
        className="pt-6 pb-4"
        title={t("sectionDocuments")}
        actions={
          viewer.isAdmin && (
            <Button onClick={() => setDraft(NEW_DRAFT)}>
              <RiAddLine data-icon="inline-start" />
              {t("newDocument")}
            </Button>
          )
        }
      />
      <div className="flex flex-col gap-5 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="size-6" />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            title={t("docsEmptyTitle")}
            icon={<RiFileTextLine className="size-5" />}
            placement="inner"
          />
        ) : (
          // Grid like the library: a preview card per document, grouped by
          // kind; status chip on the card, actions in ⋯.
          <div className="flex flex-col gap-8">
            {(Object.keys(KINDS) as Kind[]).map((kindKey) => {
              const items = documents.filter((d) =>
                kindKey === "other"
                  ? !(d.kind in KINDS) || d.kind === "other"
                  : d.kind === kindKey,
              )
              if (!items.length) return null
              return (
                <Section key={kindKey} title={t(KINDS[kindKey].labelKey)}>
                  <div className="grid grid-cols-1 gap-x-4 gap-y-6 pb-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((doc) => {
                      const status =
                        STATUSES[doc.status as Status] ?? STATUSES.draft
                      return (
                        <div
                          key={doc.id}
                          role="button"
                          tabIndex={doc.file_path ? 0 : -1}
                          onClick={() => open(doc)}
                          onKeyDown={(e) => e.key === "Enter" && open(doc)}
                          className={cn(
                            "group/row focus-visible:ring-focus-ring flex min-w-0 flex-col gap-2 rounded-xl outline-none focus-visible:ring-2",
                            doc.file_path && "cursor-pointer",
                          )}
                        >
                          <FilePreview
                            file={{
                              name: doc.file_name ?? doc.title,
                              mime_type: null,
                              file_path: doc.file_path,
                            }}
                            emptyLabel={t("noFile")}
                            badge={
                              <Chip className="static flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "size-1.5 rounded-full",
                                    status.dot,
                                  )}
                                />
                                {t(status.labelKey)}
                              </Chip>
                            }
                            className="ring-border/60 rounded-xl ring-1 transition-[filter] duration-150 group-hover/row:brightness-95"
                          />
                          <div className="flex min-w-0 items-start gap-2">
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span
                                className="truncate text-sm"
                                title={doc.title}
                              >
                                {doc.title}
                              </span>
                              <span className="text-tertiary-foreground truncate text-[13px] tabular-nums">
                                {doc.file_name
                                  ? `${formatBytes(doc.file_size)} · `
                                  : ""}
                                {format(
                                  new Date(doc.updated_at),
                                  "d MMM yyyy",
                                  {
                                    locale: dateLocale,
                                  },
                                )}
                              </span>
                            </div>
                            {docMenu(doc).length > 0 && (
                              <RowMenu label={doc.title} items={docMenu(doc)} />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Section>
              )
            })}
          </div>
        )}

        <Dialog
          open={Boolean(draft)}
          onOpenChange={(o) => !o && setDraft(null)}
        >
          {/* Same two-pane layout as the contract upload: file on the left. */}
          <DialogContent
            bare
            showCloseButton={false}
            className={twoPaneDialogClassName}
          >
            {draft && (
              <>
                <FileDropCanvas
                  file={draft.file}
                  storedUrl={storedUrl}
                  storedName={draft.currentFile}
                  labels={{
                    title: t("docDropTitle"),
                    hint: t("docDropHint"),
                    active: t("docDropActive"),
                    replace: t("docReplaceFile"),
                    remove: t("docRemoveFile"),
                  }}
                  onPick={(files) => {
                    const file = files?.[0] ?? null
                    if (!file) return
                    setDraft({
                      ...draft,
                      file,
                      title: draft.title || titleFromFile(file),
                    })
                  }}
                  onClear={() => setDraft({ ...draft, file: null })}
                />

                <aside className={twoPanePanelClassName}>
                  <div className="shrink-0 px-5 pt-5 pb-3">
                    <DialogTitle className="text-heading text-xl font-normal tracking-tight">
                      {draft.id ? t("editDocument") : t("newDocument")}
                    </DialogTitle>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pt-1 pb-5">
                    {draft.file && isCompressible(draft.file) && (
                      <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                        <span className="flex flex-col">
                          <span>{t("keepOriginalImage")}</span>
                          <span className="text-muted-foreground text-xs">
                            {t("keepOriginalImageHint")}
                          </span>
                        </span>
                        <Switch
                          checked={Boolean(draft.keepOriginal)}
                          onCheckedChange={(on) =>
                            setDraft({ ...draft, keepOriginal: on })
                          }
                        />
                      </label>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("docKind")}</Label>
                        <Select
                          value={draft.kind}
                          onValueChange={(v) =>
                            v && setDraft({ ...draft, kind: v as Kind })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {(v: Kind) => KINDS[v] && t(KINDS[v].labelKey)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(KINDS) as Kind[]).map((k) => (
                              <SelectItem key={k} value={k}>
                                {t(KINDS[k].labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>{t("colStatus")}</Label>
                        <Select
                          value={draft.status}
                          onValueChange={(v) =>
                            v && setDraft({ ...draft, status: v as Status })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {(v: Status) =>
                                STATUSES[v] && t(STATUSES[v].labelKey)
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(STATUSES) as Status[]).map((s) => (
                              <SelectItem key={s} value={s}>
                                {t(STATUSES[s].labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="doc-title">{t("docTitle")}</Label>
                      <Input
                        id="doc-title"
                        value={draft.title}
                        placeholder={t("docTitlePlaceholder")}
                        onChange={(e) =>
                          setDraft({ ...draft, title: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <footer className="border-border flex shrink-0 items-center justify-end gap-2 border-t px-4 py-3">
                    <Button variant="outline" onClick={() => setDraft(null)}>
                      {tc("cancel")}
                    </Button>
                    <Button onClick={save} disabled={saving}>
                      {saving ? tc("saving") : tc("save")}
                    </Button>
                  </footer>
                </aside>
              </>
            )}
          </DialogContent>
        </Dialog>

        <FileViewer
          items={viewerItems}
          index={viewing}
          onIndexChange={setViewing}
          onClose={() => setViewing(null)}
          actions={(item) => {
            const doc = withFile.find((d) => d.id === item.key)
            if (!doc) return null
            return (
              <RowMenu
                alwaysVisible
                label={doc.title}
                items={docMenu(doc).filter((m) => m.label !== t("libOpen"))}
              />
            )
          }}
        />

        <ConfirmDialog
          open={Boolean(deleting)}
          onOpenChange={(o) => !o && setDeleting(null)}
          title={t("deleteNamedTitle", { name: deleting?.title ?? "" })}
          description={t("docDeleteDescription")}
          confirmText={tc("delete")}
          cancelText={tc("cancel")}
          variant="destructive"
          onConfirm={async () => {
            if (!deleting) return
            const db = supabase()
            if (deleting.file_path) {
              await db.storage.from(BUCKET).remove([deleting.file_path])
            }
            const { error } = await db
              .from("project_documents")
              .delete()
              .eq("id", deleting.id)
            if (error) toast.error(t("errDeleteDoc"))
            else toast.success(t("docDeleted"))
            setDeleting(null)
            setViewing(null)
            invalidate("documents")
          }}
        />
      </div>
    </div>
  )
}
