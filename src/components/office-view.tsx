"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { runThumbnail, thumbnailCache } from "./thumbnail-queue"

/**
 * Word and Excel files drawn in the browser (docx-preview, SheetJS): the
 * file never leaves the app. Both libraries load only when one is on screen.
 * Old binary .doc and PowerPoint aren't covered; those stay "download".
 */

async function fetchBytes(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(String(res.status))
  return res.arrayBuffer()
}

/** Grabs a signed URL's bytes once per URL. */
function useBytes(url: string | null | undefined) {
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!url) return
    let alive = true
    setBytes(null)
    setFailed(false)
    fetchBytes(url)
      .then((data) => alive && setBytes(data))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [url])
  return { bytes, failed }
}

/** Width of an element, kept in sync with resizes. */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.floor(entry.contentRect.width)),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

// --- Word ---------------------------------------------------------------------

/** Symbol / Wingdings bullet glyphs → the same shape in ordinary fonts. */
const BULLETS: Record<string, string> = {
  "\uF0B7": "•",
  "\uF0A7": "▪",
  "\uF06F": "◦",
  "\uF0D8": "➢",
  "\uF076": "◆",
  "\uF0FC": "✓",
  "\uF0A8": "□",
}

/**
 * Renders a .docx into `host` as pages. Links that aren't http(s) / mailto
 * are dropped (a document could carry `javascript:` ones), the rest open in
 * a new tab. Returns the width of the widest page.
 */
async function renderDocx(bytes: ArrayBuffer, host: HTMLElement) {
  const { renderAsync } = await import("docx-preview")
  host.replaceChildren()
  await renderAsync(bytes, host, host, {
    className: "docx",
    inWrapper: true,
    breakPages: true,
    ignoreLastRenderedPageBreak: false,
    renderAltChunks: false,
    renderComments: false,
    renderChanges: false,
    useBase64URL: true,
  })
  // Word bullets are Symbol / Wingdings glyphs in the private-use area;
  // without those fonts they draw as boxes, so swap in plain bullets.
  for (const style of Array.from(host.querySelectorAll("style"))) {
    const css = style.textContent ?? ""
    const next = css.replace(/[\uF000-\uF0FF]/g, (ch) => BULLETS[ch] ?? "•")
    if (next !== css) style.textContent = next
  }
  for (const a of Array.from(host.querySelectorAll("a"))) {
    const href = a.getAttribute("href") ?? ""
    if (/^(https?:|mailto:)/i.test(href)) {
      a.target = "_blank"
      a.rel = "noopener noreferrer"
    } else if (!href.startsWith("#")) {
      a.removeAttribute("href")
    }
  }
  const pages = Array.from(host.querySelectorAll<HTMLElement>("section.docx"))
  return Math.max(816, ...pages.map((p) => p.offsetWidth))
}

/** Every page of a Word document, stacked for reading (viewer). */
export function DocxPages({
  url,
  onError,
  className,
}: {
  url: string
  onError?: () => void
  className?: string
}) {
  const { bytes, failed } = useBytes(url)
  const host = useRef<HTMLDivElement>(null)
  const [frame, width] = useWidth<HTMLDivElement>()
  const [pageWidth, setPageWidth] = useState(0)
  useEffect(() => {
    if (failed) onError?.()
  }, [failed, onError])
  useEffect(() => {
    if (!bytes || !host.current) return
    let alive = true
    renderDocx(bytes, host.current)
      .then((w) => alive && setPageWidth(w))
      .catch(() => alive && onError?.())
    return () => {
      alive = false
    }
  }, [bytes, onError])
  // Pages keep their real size; narrow screens zoom them down to fit.
  const zoom = pageWidth && width ? Math.min(1, (width - 48) / pageWidth) : 1

  return (
    <div ref={frame} className={cn("size-full overflow-auto", className)}>
      <div
        ref={host}
        className="docx-view py-6"
        style={{ zoom, opacity: pageWidth ? 1 : 0 }}
      />
    </div>
  )
}

/** Rendered Word thumbnails (sanitized markup + page width) by path. */
const docxThumbs = thumbnailCache<{ html: string; width: number }>(40)

/**
 * The top of a Word document's first page, filling the box (thumbnails).
 * Waits for a free thumbnail slot; kept in memory per `cacheKey`.
 */
export function DocxThumbnail({
  url,
  cacheKey,
  className,
}: {
  url: string | null | undefined
  /** Stable id of the file (e.g. its storage path) for the in-memory cache. */
  cacheKey?: string | null
  className?: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const [frame, width] = useWidth<HTMLDivElement>()
  const [pageWidth, setPageWidth] = useState(0)
  useEffect(() => {
    const el = host.current
    if (!el) return
    const hit = docxThumbs.get(cacheKey)
    if (hit) {
      // The same markup renderDocx produced (links already cleaned).
      el.innerHTML = hit.html
      setPageWidth(hit.width)
      return
    }
    if (!url) return
    let alive = true
    runThumbnail(async () => {
      if (!alive) return
      const bytes = await fetchBytes(url)
      if (!alive) return
      const w = await renderDocx(bytes, el)
      docxThumbs.set(cacheKey, { html: el.innerHTML, width: w })
      if (alive) setPageWidth(w)
    }).catch(() => {})
    return () => {
      alive = false
    }
  }, [url, cacheKey])
  return (
    <div ref={frame} className={cn("size-full overflow-hidden", className)}>
      <div
        ref={host}
        className="docx-view docx-view-thumb origin-top-left"
        style={{
          width: pageWidth || undefined,
          transform: `scale(${pageWidth && width ? width / pageWidth : 0})`,
        }}
      />
    </div>
  )
}

// --- Excel / CSV ------------------------------------------------------------------

type Sheet = { name: string; rows: string[][] }

/** First sheets of a workbook as text cells (capped so huge files stay fast). */
async function readSheets(
  bytes: ArrayBuffer,
  maxRows: number,
  maxCols: number,
) {
  const XLSX = await import("xlsx")
  const book = XLSX.read(bytes, {
    type: "array",
    sheetRows: maxRows,
    cellHTML: false,
  })
  return book.SheetNames.slice(0, 20).map(
    (name): Sheet => ({
      name,
      rows: (
        XLSX.utils.sheet_to_json<unknown[]>(book.Sheets[name], {
          header: 1,
          raw: false,
          defval: "",
          blankrows: false,
        }) as unknown[][]
      ).map((row) => row.slice(0, maxCols).map((cell) => String(cell ?? ""))),
    }),
  )
}

function useSheets(
  url: string | null | undefined,
  maxRows: number,
  maxCols: number,
) {
  const { bytes, failed: fetchFailed } = useBytes(url)
  const [sheets, setSheets] = useState<Sheet[] | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!bytes) return
    let alive = true
    readSheets(bytes, maxRows, maxCols)
      .then((s) => alive && setSheets(s))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [bytes, maxRows, maxCols])
  return { sheets, failed: failed || fetchFailed }
}

/** Spreadsheet column letters: 0 → A, 26 → AA. */
const column = (i: number): string =>
  (i >= 26 ? column(Math.floor(i / 26) - 1) : "") +
  String.fromCharCode(65 + (i % 26))

/** A workbook's sheets as tables, with sheet tabs (viewer). */
export function SheetView({
  url,
  onError,
  className,
}: {
  url: string
  onError?: () => void
  className?: string
}) {
  const { sheets, failed } = useSheets(url, 1000, 60)
  const [active, setActive] = useState(0)
  useEffect(() => {
    if (failed) onError?.()
  }, [failed, onError])
  if (!sheets) return null
  const sheet = sheets[Math.min(active, sheets.length - 1)]
  const cols = Math.max(1, ...(sheet?.rows.map((r) => r.length) ?? [1]))

  return (
    <div className={cn("flex size-full flex-col p-6", className)}>
      <div className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden rounded-[4px] shadow-(--elev-3)">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="border-separate border-spacing-0 text-xs tabular-nums">
            <thead className="bg-muted-solid text-muted-foreground sticky top-0 z-10">
              <tr>
                <th className="bg-muted-solid sticky left-0 z-10 w-10 border-r border-b" />
                {Array.from({ length: cols }, (_, i) => (
                  <th
                    key={i}
                    className="min-w-24 border-r border-b px-2 py-1 text-left font-medium"
                  >
                    {column(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet?.rows.map((row, r) => (
                <tr key={r}>
                  <td className="bg-muted-solid text-muted-foreground sticky left-0 border-r border-b px-2 py-1 text-right">
                    {r + 1}
                  </td>
                  {Array.from({ length: cols }, (_, c) => (
                    <td
                      key={c}
                      className="max-w-80 truncate border-r border-b px-2 py-1"
                      title={row[c] || undefined}
                    >
                      {row[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {sheets.length > 1 && (
          <div className="bg-muted/50 flex shrink-0 gap-1 overflow-x-auto border-t p-1">
            {sheets.map((s, i) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors",
                  i === active
                    ? "bg-background text-foreground shadow-(--elev-1)"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** First-sheet cells of thumbnails by path. */
const sheetThumbs = thumbnailCache<string[][]>()

/**
 * The top-left of the first sheet (thumbnails). Waits for a free thumbnail
 * slot; kept in memory per `cacheKey`.
 */
export function SheetThumbnail({
  url,
  cacheKey,
  className,
}: {
  url: string | null | undefined
  /** Stable id of the file (e.g. its storage path) for the in-memory cache. */
  cacheKey?: string | null
  className?: string
}) {
  const [parsed, setParsed] = useState<{
    key: string
    rows: string[][]
  } | null>(null)
  const cached = sheetThumbs.get(cacheKey)
  useEffect(() => {
    if (!url || sheetThumbs.get(cacheKey)) return
    let alive = true
    const key = cacheKey ?? url
    runThumbnail(async () => {
      if (!alive) return
      const bytes = await fetchBytes(url)
      if (!alive) return
      const sheets = await readSheets(bytes, 14, 5)
      const first = sheets[0]?.rows ?? []
      sheetThumbs.set(cacheKey, first)
      if (alive) setParsed({ key, rows: first })
    }).catch(() => {})
    return () => {
      alive = false
    }
  }, [url, cacheKey])
  const rows =
    cached ?? (parsed && parsed.key === (cacheKey ?? url) ? parsed.rows : [])
  return (
    <table
      className={cn(
        "w-full table-fixed text-[7px] leading-[1.6] text-neutral-700",
        className,
      )}
    >
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            className={cn(
              "border-b border-neutral-200",
              i === 0 && "font-semibold",
            )}
          >
            {row.slice(0, 5).map((cell, j) => (
              <td key={j} className="truncate px-1">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
