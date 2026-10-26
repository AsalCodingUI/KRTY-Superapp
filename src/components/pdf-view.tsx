"use client"

import { cn } from "@/lib/utils"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { runThumbnail, thumbnailCache } from "./thumbnail-queue"
import { Zoomable } from "./zoomable"

/**
 * PDFs drawn with pdf.js instead of the browser's PDF plugin, which some
 * browsers don't have (Chromium builds, iOS Safari, "download PDFs" setting)
 * and then show a broken-file icon. Loaded only when a PDF is on screen.
 */
let pdfjs: Promise<typeof import("pdfjs-dist")> | null = null
function loadPdfjs() {
  pdfjs ??= import("pdfjs-dist").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString()
    return lib
  })
  return pdfjs
}

function usePdf(url: string | null | undefined) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!url) return
    let alive = true
    let task: { destroy: () => Promise<void> } | null = null
    setDoc(null)
    setFailed(false)
    loadPdfjs()
      .then((lib) => {
        const loading = lib.getDocument({ url })
        task = loading
        if (!alive) loading.destroy()
        return loading.promise
      })
      .then((pdf) => alive && setDoc(pdf))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
      task?.destroy()
    }
  }, [url])
  return { doc, failed }
}

/**
 * Draws one page at `width` CSS pixels (sharp on retina). A new width takes
 * effect at once by stretching the last drawing (smooth while pinching),
 * then the page is redrawn sharp once the width stops changing.
 */
function PdfPage({
  doc,
  page,
  width,
  className,
}: {
  doc: PDFDocumentProxy
  page: number
  width: number
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  // Page height / width, known after the first draw.
  const aspect = useRef<number | null>(null)
  const drawn = useRef(false)

  useLayoutEffect(() => {
    const canvas = ref.current
    if (!canvas || aspect.current === null) return
    canvas.style.width = `${width}px`
    canvas.style.height = `${Math.floor(width * aspect.current)}px`
  }, [width])

  useEffect(() => {
    let task: { cancel: () => void } | null = null
    let alive = true
    // First draw right away; later ones once the width settles.
    const timer = window.setTimeout(
      () => {
        doc.getPage(page).then((p) => {
          const canvas = ref.current
          if (!alive || !canvas || width <= 0) return
          const base = p.getViewport({ scale: 1 })
          aspect.current = base.height / base.width
          const ratio = Math.min(window.devicePixelRatio || 1, 2)
          const viewport = p.getViewport({
            scale: (width / base.width) * ratio,
          })
          // Draw off-screen, then swap, so the page never flashes blank.
          const next = document.createElement("canvas")
          next.width = Math.floor(viewport.width)
          next.height = Math.floor(viewport.height)
          const render = p.render({ canvas: next, viewport })
          task = render
          render.promise
            .then(() => {
              if (!alive) return
              canvas.width = next.width
              canvas.height = next.height
              canvas.getContext("2d")?.drawImage(next, 0, 0)
              canvas.style.width = `${width}px`
              canvas.style.height = `${Math.floor(viewport.height / ratio)}px`
              drawn.current = true
            })
            .catch(() => {})
        })
      },
      drawn.current ? 180 : 0,
    )
    return () => {
      alive = false
      window.clearTimeout(timer)
      task?.cancel()
    }
  }, [doc, page, width])
  return <canvas ref={ref} className={cn("block bg-white", className)} />
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

/** Rendered first pages (PNG data URLs) by storage path. */
const pdfThumbs = thumbnailCache<string>()

/**
 * First page only, filling the box's width (thumbnails). Loads only the
 * bytes page 1 needs (range requests, no pre-fetch), waits for a free
 * thumbnail slot, and is kept as an image per `cacheKey` (storage path).
 */
export function PdfThumbnail({
  url,
  cacheKey,
  className,
}: {
  url: string | null | undefined
  /** Stable id of the file (e.g. its storage path) for the in-memory cache. */
  cacheKey?: string | null
  className?: string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [rendered, setRendered] = useState<{ key: string; src: string } | null>(
    null,
  )
  const cached = pdfThumbs.get(cacheKey)
  const src =
    cached ??
    (rendered && rendered.key === (cacheKey ?? url) ? rendered.src : null)
  const ready = width > 0

  useEffect(() => {
    if (!url || !ready || pdfThumbs.get(cacheKey)) return
    let alive = true
    let loading: { destroy: () => Promise<void> } | null = null
    let render: { cancel: () => void } | null = null
    const key = cacheKey ?? url
    const target = ref.current?.clientWidth ?? 0
    runThumbnail(async () => {
      if (!alive) return
      const lib = await loadPdfjs()
      if (!alive) return
      const task = lib.getDocument({
        url,
        // Only what page 1 needs: range requests, no background pre-fetch
        // (pdf.js needs streaming off for that to hold).
        disableAutoFetch: true,
        disableStream: true,
        rangeChunkSize: 65536,
      })
      loading = task
      try {
        const pdf = await task.promise
        if (!alive) return
        const page = await pdf.getPage(1)
        if (!alive || target <= 0) return
        const base = page.getViewport({ scale: 1 })
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        const viewport = page.getViewport({
          scale: (target / base.width) * ratio,
        })
        const canvas = document.createElement("canvas")
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const job = page.render({ canvas, viewport })
        render = job
        await job.promise
        if (!alive && !cacheKey) return
        const dataUrl = canvas.toDataURL("image/png")
        pdfThumbs.set(cacheKey, dataUrl)
        if (alive) setRendered({ key, src: dataUrl })
      } finally {
        void task.destroy()
      }
    }).catch(() => {})
    return () => {
      alive = false
      render?.cancel()
      void loading?.destroy()
    }
  }, [url, cacheKey, ready, ref])

  return (
    <div ref={ref} className={cn("size-full overflow-hidden", className)}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="block w-full bg-white" />
      )}
    </div>
  )
}

/**
 * Every page stacked for reading (previews); stops at `maxPages`.
 * Pinch on a trackpad to zoom, two fingers to pan.
 */
export function PdfPages({
  url,
  maxPages = 60,
  onError,
  className,
  contentClassName,
}: {
  url: string
  maxPages?: number
  onError?: () => void
  className?: string
  /** On the stack of pages, e.g. extra top padding under a toolbar. */
  contentClassName?: string
}) {
  const { doc, failed } = usePdf(url)
  useEffect(() => {
    if (failed) onError?.()
  }, [failed, onError])
  const pages = doc ? Math.min(doc.numPages, maxPages) : 0
  return (
    <Zoomable className={cn("size-full", className)} min={0.5} max={4}>
      {(zoom, view) => {
        const pageWidth = Math.round((Math.min(view.width, 900) - 48) * zoom)
        return (
          doc && (
            <div
              className={cn(
                "flex w-max min-w-full flex-col items-center gap-4 px-6 py-6",
                contentClassName,
              )}
            >
              {Array.from({ length: pages }, (_, i) => (
                <PdfPage
                  key={i}
                  doc={doc}
                  page={i + 1}
                  width={pageWidth}
                  className="rounded-[4px] shadow-(--elev-3)"
                />
              ))}
            </div>
          )
        )
      }}
    </Zoomable>
  )
}
