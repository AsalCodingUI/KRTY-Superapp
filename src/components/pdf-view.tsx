"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { runThumbnail, thumbnailCache } from "./thumbnail-queue"

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

/** Draws one page to fit `width` CSS pixels (sharp on retina). */
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
  useEffect(() => {
    let task: { cancel: () => void } | null = null
    let alive = true
    doc.getPage(page).then((p) => {
      const canvas = ref.current
      if (!alive || !canvas || width <= 0) return
      const base = p.getViewport({ scale: 1 })
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const viewport = p.getViewport({ scale: (width / base.width) * ratio })
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${width}px`
      canvas.style.height = `${Math.floor(viewport.height / ratio)}px`
      const render = p.render({ canvas, viewport })
      task = render
      render.promise.catch(() => {})
    })
    return () => {
      alive = false
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

/** Every page stacked for reading (previews); stops at `maxPages`. */
export function PdfPages({
  url,
  maxPages = 60,
  onError,
  className,
}: {
  url: string
  maxPages?: number
  onError?: () => void
  className?: string
}) {
  const { doc, failed } = usePdf(url)
  const [ref, width] = useWidth<HTMLDivElement>()
  useEffect(() => {
    if (failed) onError?.()
  }, [failed, onError])
  const pages = doc ? Math.min(doc.numPages, maxPages) : 0
  const pageWidth = Math.min(width, 900)
  return (
    <div ref={ref} className={cn("size-full overflow-y-auto", className)}>
      {doc && pageWidth > 0 && (
        <div className="flex flex-col items-center gap-4 py-6">
          {Array.from({ length: pages }, (_, i) => (
            <PdfPage
              key={i}
              doc={doc}
              page={i + 1}
              width={pageWidth - 48}
              className="rounded-[4px] shadow-(--elev-3)"
            />
          ))}
        </div>
      )}
    </div>
  )
}
