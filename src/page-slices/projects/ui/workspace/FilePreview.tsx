"use client"

import { DocxThumbnail, SheetThumbnail } from "@/components/office-view"
import { PdfThumbnail } from "@/components/pdf-view"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { useQuery } from "@tanstack/react-query"
import { Play } from "lucide-react"
import { useState } from "react"
import { useFileUrl, type FileRow } from "./data"

type Kind =
  | "image"
  | "video"
  | "pdf"
  | "text"
  | "csv"
  | "sheet"
  | "docx"
  | "doc"
  | "other"

const TEXT_EXT = ["md", "markdown", "txt", "json", "log", "yml", "yaml"]

export function extensionOf(name: string) {
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ""
}

export function fileKind(file: Pick<FileRow, "name" | "mime_type">): Kind {
  const mime = file.mime_type ?? ""
  const ext = extensionOf(file.name)
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime === "application/pdf" || ext === "pdf") return "pdf"
  if (ext === "csv" || mime === "text/csv") return "csv"
  if (mime.startsWith("text/") || TEXT_EXT.includes(ext)) return "text"
  if (["xls", "xlsx", "xlsm", "ods"].includes(ext)) return "sheet"
  if (ext === "docx") return "docx"
  // No in-browser renderer for these (yet): a tinted "no preview" tile.
  if (
    ["doc", "pages", "odt", "rtf", "ppt", "pptx", "key", "numbers"].includes(
      ext,
    )
  )
    return "doc"
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "other"
  return "other"
}

/** The white "page" a document preview sits on, centred on the tile. */
function Paper({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="flex h-full items-end justify-center px-[14%] pt-[9%]">
      <div
        className={cn(
          "h-full w-full overflow-hidden rounded-t-[4px] bg-white shadow-(--shadow-lift)",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** First couple of KB of a text file, for the preview. */
function useTextSnippet(url: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["file-snippet", url],
    enabled: Boolean(url) && enabled,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(url!, { headers: { Range: "bytes=0-2047" } })
      const text = await res.text()
      return text.slice(0, 2048)
    },
  })
}

/** Soft tint behind files that have no preview (VEED style). */
const NO_PREVIEW_TINT: Record<string, string> = {
  sheet: "from-green-3 to-green-5",
  doc: "from-blue-3 to-violet-4",
  other: "from-violet-3 to-blue-4",
}

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

/** Dark translucent chip on a thumbnail (type, duration, status). */
export function Chip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "absolute rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] leading-4 font-medium text-white tabular-nums backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * The thumbnail of a library file: the picture itself, a video's first
 * frame (with its length), a PDF's first page, or a text / CSV excerpt on a
 * white page; anything else gets a soft tint with "no preview". The type
 * sits in a chip top right. Never interactive (the card is).
 */
export function FilePreview({
  file,
  badge,
  emptyLabel,
  className,
}: {
  /** `file_path` null = nothing uploaded yet (shows `emptyLabel`). */
  file: Pick<FileRow, "name" | "mime_type"> & { file_path: string | null }
  /** Chip in the top-left corner, e.g. a document's status. */
  badge?: React.ReactNode
  emptyLabel?: string
  className?: string
}) {
  const t = useT("projects")
  const missing = !file.file_path
  const kind: Kind = missing ? "other" : fileKind(file)
  const needsUrl = kind !== "doc" && kind !== "other"
  const { data: url } = useFileUrl(needsUrl ? file.file_path : null)
  const textual = kind === "text" || kind === "csv"
  const { data: snippet } = useTextSnippet(url, textual)
  const [duration, setDuration] = useState<number | null>(null)
  const ext = extensionOf(file.name).toUpperCase() || "FILE"

  return (
    <div
      className={cn(
        "bg-muted pointer-events-none relative aspect-[16/10] overflow-hidden select-none",
        className,
      )}
      aria-hidden="true"
    >
      {kind === "image" && url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          className="size-full object-cover"
        />
      )}

      {kind === "video" && url && (
        <>
          <video
            src={`${url}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            onLoadedMetadata={(e) =>
              setDuration(e.currentTarget.duration || null)
            }
            className="size-full object-cover"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
              <Play className="size-4 translate-x-px fill-current" />
            </span>
          </span>
          {duration !== null && (
            <Chip className="right-2 bottom-2">{formatDuration(duration)}</Chip>
          )}
        </>
      )}

      {kind === "pdf" && (
        <Paper>
          {/* Drawn with pdf.js: the browser's PDF plugin isn't everywhere. */}
          <PdfThumbnail url={url} />
        </Paper>
      )}

      {kind === "text" && (
        <Paper className="p-3">
          <p className="line-clamp-[12] font-mono text-[7px] leading-[1.5] whitespace-pre-wrap text-neutral-700">
            {snippet ?? ""}
          </p>
        </Paper>
      )}

      {kind === "csv" && (
        <Paper className="p-2">
          <table className="w-full table-fixed text-[7px] leading-[1.6] text-neutral-700">
            <tbody>
              {(snippet ?? "")
                .split(/\r?\n/)
                .filter(Boolean)
                .slice(0, 14)
                .map((line, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-neutral-200",
                      i === 0 && "font-semibold",
                    )}
                  >
                    {line
                      .split(",")
                      .slice(0, 4)
                      .map((cell, j) => (
                        <td key={j} className="truncate px-1">
                          {cell.replace(/^"|"$/g, "")}
                        </td>
                      ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </Paper>
      )}

      {kind === "docx" && (
        <Paper>
          <DocxThumbnail url={url} />
        </Paper>
      )}

      {kind === "sheet" && (
        <Paper className="p-2">
          <SheetThumbnail url={url} />
        </Paper>
      )}

      {(kind === "doc" || kind === "other") && (
        <div
          className={cn(
            "grid size-full place-items-center bg-gradient-to-br",
            NO_PREVIEW_TINT[kind],
          )}
        >
          <span className="text-foreground/45 text-sm">
            {missing ? (emptyLabel ?? t("noFile")) : t("libNoPreview")}
          </span>
        </div>
      )}

      {!missing && <Chip className="top-2 right-2">{ext}</Chip>}
      {badge && <span className="absolute top-2 left-2">{badge}</span>}
    </div>
  )
}
