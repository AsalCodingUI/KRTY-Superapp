"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import { AiDocButton } from "@/page-slices/policies/ui/ai-assist"
import { MarkdownDocEditor } from "@/page-slices/policies/ui/doc-editor-lazy"
import type { Editor } from "@tiptap/react"
import { useWorkspace } from "./data"
import { ReportViewsIndicator } from "./ReportViews"
import { ReportTemplatePicker } from "./ReportTemplatePicker"
import { useT } from "@/shared/i18n/client"
import { RiCloseLine, RiFileCopyLine } from "@/shared/ui/lucide-icons"
import { Link2, Link2Off, Save, X } from "@/components/icons"
import { copyText, useContextTarget, type CtxItem } from "@/shared/context-menu"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import {
  createReport,
  fetchReportBody,
  newShareToken,
  registerShareUndo,
  reportShareUrl,
  updateReport,
  uploadDocFile,
  uploadReportImage,
  type Report,
  type ReportSummary,
} from "./reports-data"

// Lives with the data, so menus get it without loading this window.
export { reportShareUrl }

/**
 * A daily report in the notes editor (title, toolbar, "/" blocks, images by
 * "/", paste or drop). "Bagikan" makes a link for the client that shows
 * this report alone; turning it off kills the link. Unsaved changes ask
 * before closing.
 */
export function ReportDialog({
  open,
  onOpenChange,
  report,
  defaultTitle,
  projectId,
  viewerId,
  canEdit,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The report to open; none for a new one. */
  report: ReportSummary | null
  defaultTitle: string
  projectId: string
  viewerId: string | null
  /** The author or an admin; others read it in the editor without saving. */
  canEdit: boolean
  onSaved: () => void
}) {
  const t = useT("projects")
  const tu = useT("undo")
  const tc = useT("common")
  const projectName = useWorkspace(projectId).data?.project?.name
  const [current, setCurrent] = useState<ReportSummary | null>(null)
  const [title, setTitle] = useState("")
  const body = useRef("")
  // The body the editor starts from; a list row arrives without one, so
  // until it's read the editor waits and nothing can be saved over it.
  const [initialBody, setInitialBody] = useState<string | null>(null)
  const [saved, setSaved] = useState({ title: "", body: "" })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)
  const ready = initialBody !== null

  useEffect(() => {
    // Closed: the next report must not start from this one's body.
    if (!open) return setInitialBody(null)
    setCurrent(report)
    const first = report?.title ?? defaultTitle
    setTitle(first)
    setDirty(false)
    const start = (text: string) => {
      body.current = text
      setInitialBody(text)
      setSaved({ title: report ? first : "", body: text })
    }
    if (!report || typeof report.body === "string") {
      start(report?.body ?? "")
      return
    }
    setInitialBody(null)
    let live = true
    fetchReportBody(report.id).then(
      (text) => live && start(text),
      () => {
        if (!live) return
        toast.error(t("errLoadReport"))
        onOpenChange(false)
      },
    )
    return () => {
      live = false
    }
    // Once per opened report; `t` and the callback don't restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, report, defaultTitle])

  // Changes worth asking about before closing: for a new report, anything
  // written or a title other than the default one.
  const markDirty = (nextTitle: string, nextBody: string) =>
    setDirty(
      current
        ? nextTitle.trim() !== saved.title ||
            nextBody.trimEnd() !== saved.body.trimEnd()
        : nextBody.trim() !== "" || nextTitle.trim() !== defaultTitle.trim(),
    )

  /** Saves; returns the saved report (null when it failed). */
  const save = async (): Promise<Report | null> => {
    const name = title.trim()
    if (!name || saving || !viewerId || !ready) return null
    setSaving(true)
    try {
      const next = current
        ? await updateReport(current.id, { title: name, body: body.current })
        : await createReport({
            projectId,
            authorId: viewerId,
            title: name,
            body: body.current,
          })
      setCurrent(next)
      setSaved({ title: name, body: body.current })
      setDirty(false)
      toast.success(t("reportSaved"))
      onSaved()
      return next
    } catch {
      toast.error(t("errSaveReport"))
      return null
    } finally {
      setSaving(false)
    }
  }

  const share = async (on: boolean) => {
    if (sharing) return
    setSharing(true)
    try {
      // A new report is saved first: the link shows what's saved.
      const base = current ?? (await save())
      if (!base) return
      const next = await updateReport(
        base.id,
        on
          ? {
              share_token: newShareToken(),
              shared_at: new Date().toISOString(),
            }
          : { share_token: null, shared_at: null },
      )
      setCurrent(next)
      onSaved()
      registerShareUndo({
        before: base,
        after: next,
        label: tu(on ? "reportShare" : "reportUnshare", { title: base.title }),
        done: (report) => {
          setCurrent((c) => (c?.id === report.id ? report : c))
          onSaved()
        },
      })
      if (on && next.share_token) {
        await navigator.clipboard
          .writeText(reportShareUrl(next.share_token, projectName))
          .catch(() => {})
        toast.success(t("reportLinkCreated"))
      } else toast.success(t("reportLinkOff"))
    } catch {
      toast.error(t("errShareReport"))
    } finally {
      setSharing(false)
    }
  }

  const requestClose = () =>
    canEdit && dirty ? setConfirmClose(true) : onOpenChange(false)

  const link = current?.share_token
    ? reportShareUrl(current.share_token, projectName)
    : ""

  // Right-click on the header: the same share / save / close as its buttons.
  const headerRef = useRef<HTMLElement>(null)
  useContextTarget(
    headerRef,
    (): CtxItem[] => [
      {
        id: "copy-client-link",
        label: t("ctxCopyClientLink"),
        icon: Link2,
        hidden: !link,
        onSelect: async () => {
          if (await copyText(link)) toast.success(t("reportLinkCopied"))
        },
      },
      {
        id: "share",
        label: t("reportCreateLink"),
        icon: Link2,
        hidden: Boolean(link) || !canEdit || !title.trim(),
        disabled: sharing,
        onSelect: () => share(true),
      },
      {
        id: "stop-sharing",
        label: t("reportStopSharing"),
        icon: Link2Off,
        hidden: !link || !canEdit,
        destructive: true,
        confirm: true,
        onSelect: () => share(false),
      },
      {
        id: "save",
        label: tc("save"),
        icon: Save,
        hidden: !canEdit,
        disabled: !title.trim() || saving || (Boolean(current) && !dirty),
        onSelect: () => void save(),
      },
      {
        id: "close",
        label: tc("close"),
        icon: X,
        shortcut: "Escape",
        onSelect: requestClose,
      },
    ],
    { type: "project-report-window", label: title || defaultTitle },
  )

  return (
    <Dialog
      open={open}
      // The editor's own Esc (the "/" menu, the link field) stops there,
      // so an Esc that gets here means "close" (with the unsaved check).
      onOpenChange={(o) => {
        if (!o) requestClose()
      }}
    >
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(56rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        <header
          ref={headerRef}
          className="border-border flex shrink-0 items-center gap-2 border-b px-4 py-3"
        >
          <DialogTitle className="sr-only">{title || defaultTitle}</DialogTitle>
          <input
            value={title}
            readOnly={!canEdit || !ready}
            maxLength={160}
            aria-label={t("reportTitle")}
            onChange={(e) => {
              setTitle(e.target.value)
              markDirty(e.target.value, body.current)
            }}
            className="text-heading placeholder:text-tertiary-foreground min-w-0 flex-1 border-0 bg-transparent text-lg font-medium shadow-none ring-0 outline-none focus:ring-0 focus-visible:ring-0"
          />
          {current?.share_token && (
            <ReportViewsIndicator projectId={projectId} reportId={current.id} />
          )}
          {canEdit && editor && !editor.isDestroyed && (
            <AiDocButton editor={editor} summarize />
          )}
          {canEdit && (
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!title.trim()}
                    aria-label={
                      current?.share_token
                        ? t("reportShared")
                        : t("reportShare")
                    }
                  />
                }
              >
                <Link2 data-icon="inline-start" />
                {/* Phones: the icon alone, so the title keeps some room. */}
                <span className="hidden sm:inline">
                  {current?.share_token ? t("reportShared") : t("reportShare")}
                </span>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <div className="flex flex-col gap-3 text-sm">
                  <p className="font-medium">{t("reportShareTitle")}</p>
                  {link ? (
                    <>
                      <div className="flex gap-2">
                        <Input readOnly value={link} className="text-xs" />
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={t("reportCopyLink")}
                          onClick={() =>
                            navigator.clipboard
                              .writeText(link)
                              .then(() => toast.success(t("reportLinkCopied")))
                          }
                        >
                          <RiFileCopyLine />
                        </Button>
                      </div>
                      <Button
                        variant="destructive-ghost"
                        size="sm"
                        className="self-start"
                        disabled={sharing}
                        onClick={() => share(false)}
                      >
                        {t("reportStopSharing")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-meta">
                        {t("reportShareHint")}
                      </p>
                      <Button
                        size="sm"
                        className="self-start"
                        disabled={sharing}
                        onClick={() => share(true)}
                      >
                        {sharing && <Spinner data-icon="inline-start" />}
                        {t("reportCreateLink")}
                      </Button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {canEdit && (
            <Button
              size="sm"
              onClick={save}
              disabled={!title.trim() || saving || (Boolean(current) && !dirty)}
            >
              {saving && <Spinner data-icon="inline-start" />}
              {tc("save")}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={tc("close")}
            onClick={requestClose}
          >
            <RiCloseLine />
          </Button>
        </header>

        {/* An empty report: Daily / Weekly to start from. The template's
            title replaces only the default one. */}
        {open && canEdit && editor && !editor.isDestroyed && (
          <ReportTemplatePicker
            key={`template-${report?.id ?? "new"}`}
            editor={editor}
            onTitle={(next) => {
              if (title.trim() && title.trim() !== defaultTitle.trim()) return
              setTitle(next)
              markDirty(next, body.current)
            }}
          />
        )}

        {open && !ready && (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-6" />
          </div>
        )}
        {open && ready && (
          <MarkdownDocEditor
            key={report?.id ?? "new"}
            value={initialBody}
            ariaLabel={t("reportBody")}
            mentionProjectId={projectId}
            className="flex-1"
            onUploadImage={
              canEdit
                ? (file, original) =>
                    uploadReportImage(projectId, file, original)
                : undefined
            }
            onUploadFile={
              canEdit ? (file) => uploadDocFile(projectId, file) : undefined
            }
            readOnly={!canEdit}
            onReady={setEditor}
            onChange={(markdown) => {
              body.current = markdown
              markDirty(title, markdown)
            }}
          />
        )}

        <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("libNoteUnsaved")}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setConfirmClose(false)}>
                {tc("cancel")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmClose(false)
                  onOpenChange(false)
                }}
              >
                {t("libNoteDiscard")}
              </Button>
              <Button
                disabled={saving}
                onClick={async () => {
                  if (await save()) {
                    setConfirmClose(false)
                    onOpenChange(false)
                  }
                }}
              >
                {tc("save")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
