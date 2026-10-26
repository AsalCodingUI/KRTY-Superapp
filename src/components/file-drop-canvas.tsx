"use client"

import { PdfPages } from "@/components/pdf-view"
import { ZoomableImage } from "@/components/zoomable"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  RiCloseLine,
  RiFileTextLine,
  RiUploadLine,
} from "@/shared/ui/lucide-icons"
import { useEffect, useMemo, useRef, useState } from "react"

export interface FileDropCanvasLabels {
  /** Empty state: "Click or drag a file here". */
  title: string
  /** Empty state, second line: allowed types and size. */
  hint: string
  /** While a file is dragged over. */
  active: string
  replace: string
  remove: string
}

type Kind = "pdf" | "image" | "other"

function kindOf(name: string | null | undefined, type?: string): Kind {
  const ext = name?.split(".").pop()?.toLowerCase() ?? ""
  if (type === "application/pdf" || ext === "pdf") return "pdf"
  if (
    type?.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(ext)
  )
    return "image"
  return "other"
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * The left pane of an upload dialog (invoice-editor layout): an empty drop
 * zone to click or drag a file into, then a preview of the chosen file
 * (PDF page by page, images as is, anything else as a file card). When
 * editing, the stored file shows until it is replaced.
 */
export function FileDropCanvas({
  file,
  storedUrl,
  storedName,
  accept,
  labels,
  replaceHint,
  onPick,
  onClear,
  className,
}: {
  file: File | null
  /** Signed URL of the file already saved (editing). */
  storedUrl?: string | null
  storedName?: string | null
  accept?: string
  labels: FileDropCanvasLabels
  /** Shown under the stored file, e.g. what replacing it will cause. */
  replaceHint?: string | null
  onPick: (files: FileList | null) => void
  onClear: () => void
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const localUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  )
  useEffect(
    () => () => {
      if (localUrl) URL.revokeObjectURL(localUrl)
    },
    [localUrl],
  )
  const url = localUrl ?? storedUrl ?? null
  const name = file?.name ?? storedName ?? null
  const kind = kindOf(name, file?.type)
  const hasFile = Boolean(file || storedName || storedUrl)
  const browse = () => inputRef.current?.click()

  return (
    <div
      className={cn(
        "dark:bg-popover relative flex min-h-0 flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 dark:ring-white/8",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        onPick(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onPick(e.target.files)
          e.target.value = ""
        }}
      />

      {hasFile ? (
        <>
          {kind === "pdf" && url ? (
            <PdfPages
              url={url}
              className="bg-muted/40 min-h-0 flex-1"
              contentClassName="pt-16"
            />
          ) : kind === "image" && url ? (
            <ZoomableImage
              key={url}
              src={url}
              name={name}
              mime={file?.type}
              className="bg-muted/40 min-h-0 flex-1"
            />
          ) : (
            <div className="bg-muted/40 grid min-h-0 flex-1 place-items-center p-10">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="bg-background dark:bg-surface text-muted-foreground grid size-14 place-items-center rounded-2xl shadow-(--elev-2) [&_svg]:size-6">
                  <RiFileTextLine />
                </span>
                <span className="text-foreground max-w-xs truncate text-sm font-medium">
                  {name}
                </span>
                {file && (
                  <span className="text-muted-foreground text-[13px] tabular-nums">
                    {formatSize(file.size)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* One solid pill so it reads over a white page. */}
          <div className="bg-popover text-popover-foreground absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-0.5 rounded-full p-1 shadow-(--elev-3)">
            {name && (
              <span className="truncate px-2.5 text-xs font-medium">
                {name}
              </span>
            )}
            <Button size="sm" variant="ghost" onClick={browse}>
              <RiUploadLine data-icon="inline-start" />
              {labels.replace}
            </Button>
            {file && (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={labels.remove}
                title={labels.remove}
                onClick={onClear}
              >
                <RiCloseLine />
              </Button>
            )}
          </div>
          {replaceHint && !file && (
            <p className="bg-popover text-muted-foreground absolute bottom-3 left-3 rounded-full px-3 py-1.5 text-xs shadow-(--elev-3)">
              {replaceHint}
            </p>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={browse}
          className="group/drop m-3 flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl outline-none"
        >
          <span
            className={cn(
              "border-foreground/15 group-focus-visible/drop:border-primary/60 pointer-events-none absolute inset-3 rounded-2xl border-[1.5px] border-dashed transition-colors duration-200",
              dragging
                ? "border-primary bg-primary/5"
                : "group-hover/drop:border-foreground/25 group-hover/drop:bg-foreground/[0.02]",
            )}
            aria-hidden
          />
          <span className="bg-background dark:bg-surface text-muted-foreground relative grid size-12 place-items-center rounded-2xl shadow-(--elev-2) transition-transform duration-200 ease-out group-hover/drop:-translate-y-0.5 [&_svg]:size-5">
            <RiUploadLine />
          </span>
          <span className="relative flex flex-col items-center gap-1 text-center">
            <span className="text-foreground text-sm font-medium">
              {dragging ? labels.active : labels.title}
            </span>
            <span className="text-muted-foreground text-[13px]">
              {labels.hint}
            </span>
          </span>
        </button>
      )}
    </div>
  )
}

/**
 * Dialog shell for the two-pane upload layout: the preview on the left, the
 * form on the right. One drop-shadow filter on the pair shadows their union,
 * so neither pane's shadow falls on the other.
 */
export const twoPaneDialogClassName =
  "max-sm:before:hidden max-sm:pt-0 grid h-[min(92svh,52rem)] w-[min(94vw,72rem)] max-w-none grid-cols-1 grid-rows-[minmax(14rem,0.8fr)_minmax(0,1.2fr)] gap-2 overflow-visible rounded-none bg-transparent p-0 shadow-none! [filter:drop-shadow(0_8px_18px_oklch(0_0_0/0.06))_drop-shadow(0_30px_60px_oklch(0_0_0/0.16))] sm:max-w-none lg:grid-cols-[minmax(0,1fr)_26rem] lg:grid-rows-1 dark:[filter:drop-shadow(0_30px_60px_oklch(0_0_0/0.6))]"

/** The right (form) pane of the two-pane upload layout. */
export const twoPanePanelClassName =
  "bg-popover text-popover-foreground flex min-h-0 flex-col overflow-hidden rounded-3xl ring-1 ring-black/5 dark:ring-white/8"
