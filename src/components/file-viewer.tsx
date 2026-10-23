"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { DocxPages, SheetView } from "@/components/office-view"
import { PdfPages } from "@/components/pdf-view"
import { Spinner } from "@/components/ui/spinner"
import { useT } from "@/shared/i18n/client"
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  File as FileIcon,
  X,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

export type PreviewKind =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "docx"
  | "sheet"
  | "text"
  | "none"

const EXT: Record<Exclude<PreviewKind, "none">, string[]> = {
  image: ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg", "bmp", "ico"],
  video: ["mp4", "webm", "mov", "m4v", "ogv"],
  audio: ["mp3", "wav", "ogg", "m4a", "aac", "flac"],
  pdf: ["pdf"],
  // Drawn in the browser (office-view); old .doc and PowerPoint aren't.
  docx: ["docx"],
  sheet: ["xlsx", "xlsm", "xls", "ods", "csv"],
  text: ["txt", "md", "json", "log"],
}

/** What can be shown inline; .doc, PowerPoint, zips, PSD… are "none". */
export function previewKind(name: string, mime?: string | null): PreviewKind {
  const m = mime ?? ""
  if (m === "application/pdf") return "pdf"
  if (m.startsWith("image/") && m !== "image/vnd.adobe.photoshop")
    return "image"
  if (m.startsWith("video/")) return "video"
  if (m.startsWith("audio/")) return "audio"
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (EXT.docx.includes(ext)) return "docx"
  if (EXT.sheet.includes(ext)) return "sheet"
  if (m.startsWith("text/") || m === "application/json") return "text"
  for (const [kind, list] of Object.entries(EXT))
    if (list.includes(ext)) return kind as PreviewKind
  return "none"
}

export type ViewerItem = {
  key: string
  name: string
  mime?: string | null
  /** Shown under the name, e.g. "2.4 MB · 23 Okt". */
  meta?: string
  /** Signed URL to show the file inline. */
  getUrl: () => Promise<string>
  /** Signed URL that downloads with the given name. */
  getDownloadUrl: () => Promise<string>
}

/**
 * Full-size viewer for private files: images, video, audio, PDF, Word
 * (.docx), spreadsheets and plain text open inline; anything else (.doc,
 * PowerPoint, zip…) offers a download.
 * ← / → move between the items of the list it was opened from.
 */
export function FileViewer({
  items,
  index,
  onIndexChange,
  onClose,
  actions,
}: {
  items: ViewerItem[]
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
  /** Extra header buttons for the current item (rename, delete…). */
  actions?: (item: ViewerItem) => React.ReactNode
}) {
  const t = useT("common")
  const item = index === null ? null : items[index]
  const kind = item ? previewKind(item.name, item.mime) : "none"
  const [url, setUrl] = useState<string | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const markFailed = useCallback(() => setFailed(true), [])

  // Reload only when the shown file changes (key + name), not on every
  // re-render: lists rebuild their items, and a rename briefly keeps the old
  // path until the list refreshes.
  const latest = useRef(item)
  latest.current = item
  const identity = item ? `${item.key}\u0000${item.name}` : null

  useEffect(() => {
    let alive = true
    setUrl(null)
    setText(null)
    setFailed(false)
    const current = latest.current
    if (!current || kind === "none") return
    current
      .getUrl()
      .then(async (signed) => {
        if (!alive) return
        if (kind === "text") {
          const res = await fetch(signed)
          const body = await res.text()
          if (alive) setText(body.slice(0, 200_000))
        }
        if (alive) setUrl(signed)
      })
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [identity, kind])

  const step = (delta: number) => {
    if (index === null || items.length < 2) return
    onIndexChange((index + delta + items.length) % items.length)
  }

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest("input, textarea, [contenteditable=true]")) return
      if (e.key === "ArrowLeft") step(-1)
      if (e.key === "ArrowRight") step(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const download = async () => {
    if (!item) return
    const signed = await item.getDownloadUrl()
    window.location.assign(signed)
  }

  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        bare
        showCloseButton={false}
        className="flex h-[min(52rem,92svh)] w-full flex-col overflow-hidden p-0 sm:max-w-5xl"
      >
        {item && (
          <>
            <header className="flex h-14 shrink-0 items-center gap-2 border-b pr-3 pl-5">
              <div className="flex min-w-0 flex-1 flex-col">
                <DialogTitle className="truncate text-sm font-medium">
                  {item.name}
                </DialogTitle>
                {item.meta && (
                  <span className="text-muted-foreground truncate text-xs">
                    {item.meta}
                  </span>
                )}
              </div>
              {items.length > 1 && (
                <span className="text-muted-foreground mr-1 text-xs tabular-nums">
                  {(index ?? 0) + 1} / {items.length}
                </span>
              )}
              {actions?.(item)}
              {url && kind !== "none" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("openInNewTab")}
                  title={t("openInNewTab")}
                  className="text-muted-foreground"
                  nativeButton={false}
                  render={
                    <a href={url} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <ExternalLink />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("download")}
                title={t("download")}
                className="text-muted-foreground"
                onClick={download}
              >
                <Download />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("close")}
                className="text-muted-foreground"
                onClick={onClose}
              >
                <X />
              </Button>
            </header>

            <div className="bg-background relative flex min-h-0 flex-1 items-center justify-center">
              {kind === "none" || failed ? (
                <div className="flex max-w-sm flex-col items-center gap-3 px-6 text-center">
                  <span className="bg-background ring-border flex size-14 items-center justify-center rounded-2xl ring-1">
                    <FileIcon className="text-muted-foreground size-6" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">
                      {failed ? t("previewFailed") : t("noPreview")}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {t("noPreviewHint")}
                    </p>
                  </div>
                  <Button onClick={download}>
                    <Download data-icon="inline-start" />
                    {t("download")}
                  </Button>
                </div>
              ) : !url ? (
                <Spinner className="size-6" />
              ) : kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed, private URL
                <img
                  src={url}
                  alt={item.name}
                  className="max-h-[calc(100%-3rem)] max-w-[calc(100%-3rem)] rounded-[4px] object-contain shadow-(--shadow-lift)"
                />
              ) : kind === "video" ? (
                <video
                  key={url}
                  src={url}
                  controls
                  autoPlay
                  className="max-h-[calc(100%-3rem)] max-w-[calc(100%-3rem)] rounded-[4px] shadow-(--shadow-lift)"
                />
              ) : kind === "audio" ? (
                <audio key={url} src={url} controls autoPlay />
              ) : kind === "pdf" ? (
                <PdfPages url={url} onError={markFailed} />
              ) : kind === "docx" ? (
                <DocxPages url={url} onError={markFailed} />
              ) : kind === "sheet" ? (
                <SheetView url={url} onError={markFailed} />
              ) : (
                // Text sits on a page like the PDFs.
                <div className="size-full overflow-y-auto px-6 py-6">
                  <pre className="bg-background mx-auto min-h-full max-w-[852px] rounded-[4px] p-8 font-mono text-xs leading-5 whitespace-pre-wrap shadow-(--shadow-lift)">
                    {text}
                  </pre>
                </div>
              )}

              {items.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("previous")}
                    onClick={() => step(-1)}
                    className="bg-background/90 absolute top-1/2 left-3 -translate-y-1/2 rounded-full"
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={t("next")}
                    onClick={() => step(1)}
                    className="bg-background/90 absolute top-1/2 right-3 -translate-y-1/2 rounded-full"
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
