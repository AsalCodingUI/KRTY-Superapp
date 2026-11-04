"use client"

import { ImageLightbox, useLightbox } from "@/components/image-lightbox"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Maximize2,
  X,
} from "@/components/icons"
import { useCallback, useEffect, useRef, useState } from "react"

/** A picture in a gallery; `w`/`h` (when known) reserve its space. */
export type GalleryImage = { src: string; alt: string; w?: number; h?: number }

// The editor styles every picture (DOC_PROSE); a tile's picture undoes it.
const TILE_IMG =
  "m-0! block! h-full! max-w-none! rounded-none! border-0! object-cover ring-0! transition-opacity duration-300"

/**
 * Several pictures in one row (see shared/lib/doc-blocks): one height
 * (200px on a phone, 280px wider), each as wide as its own shape, so
 * nothing is cropped or boxed; a very wide one stops at 85% of the row so
 * the next peeks in. Scrolls sideways with a snap per picture (a swipe on
 * a phone), arrows on hover on a desktop. Reading, a click opens the
 * picture large; editing, a click picks the block (it drags, reorders,
 * and its "Buka" button opens it large). Used by the editor and by
 * `<Markdown images>`.
 */
export function GalleryStrip({
  images,
  editing = false,
  onAdd,
  onRemove,
  onMove,
  onMeasure,
}: {
  images: GalleryImage[]
  editing?: boolean
  onAdd?: () => void
  onRemove?: (index: number) => void
  /** Moves the picture at `from` to `to` (drag to reorder). */
  onMove?: (from: number, to: number) => void
  /** A picture without a known size has loaded (to remember it). */
  onMeasure?: (index: number, w: number, h: number) => void
}) {
  const t = useT("policies")
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })
  const [viewing, setViewing] = useState<number | null>(null)
  // The document's lightbox (all its pictures), else this row's own.
  const lightbox = useLightbox()
  const view = (i: number, from: Element) => {
    const img = from.closest("figure")?.querySelector("img")
    if (lightbox && img) lightbox.open(img)
    else setViewing(i)
  }
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set())

  const measure = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setEdges({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    })
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    // Pictures change the width as they load.
    for (const child of el.children) ro.observe(child)
    return () => ro.disconnect()
  }, [measure, images.length, editing])

  const page = (dir: 1 | -1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" })
  }

  const round =
    "bg-popover/90 text-foreground grid place-items-center rounded-full shadow-(--elev-3) backdrop-blur"

  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      data-gallery-control
      aria-label={t(dir < 0 ? "galleryPrev" : "galleryNext")}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => page(dir)}
      className={cn(
        round,
        "absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 transition-opacity sm:grid",
        "opacity-0 group-hover/gallery:opacity-100 focus-visible:opacity-100",
        dir < 0 ? "left-2" : "right-2",
        (dir < 0 ? edges.start : edges.end) && "pointer-events-none invisible",
      )}
    >
      {dir < 0 ? (
        <ChevronLeft className="size-4" />
      ) : (
        <ChevronRight className="size-4" />
      )}
    </button>
  )

  return (
    <div className="group/gallery relative my-4" data-gallery>
      <div
        ref={scroller}
        onScroll={measure}
        className="flex h-[200px] snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain rounded-xl [scrollbar-width:none] sm:h-[280px] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => {
          const sized = Boolean(img.w && img.h)
          const shown = loaded.has(img.src)
          const picture = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              draggable={false}
              data-lightbox
              ref={(el) => {
                // Already there (cached) before React saw it load.
                if (el?.complete && el.naturalWidth && !shown)
                  setLoaded((s) => new Set(s).add(img.src))
              }}
              onLoad={(e) => {
                const el = e.currentTarget
                setLoaded((s) => new Set(s).add(img.src))
                if (!sized && el.naturalWidth)
                  onMeasure?.(i, el.naturalWidth, el.naturalHeight)
                measure()
              }}
              className={cn(
                TILE_IMG,
                sized ? "w-full!" : "w-auto!",
                shown ? "opacity-100" : "opacity-0",
              )}
            />
          )
          return (
            <figure
              key={`${img.src}-${i}`}
              data-gallery-tile
              draggable={editing && Boolean(onMove)}
              onDragStart={(e) => {
                if (!editing || !onMove) return
                setDragFrom(i)
                e.dataTransfer.effectAllowed = "move"
                e.dataTransfer.setData("text/x-gallery-index", String(i))
              }}
              onDragOver={(e) => {
                if (dragFrom === null) return
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
                setDragOver(i)
              }}
              onDragLeave={() => setDragOver((o) => (o === i ? null : o))}
              onDrop={(e) => {
                if (dragFrom === null) return
                e.preventDefault()
                if (dragFrom !== i) onMove?.(dragFrom, i)
                setDragFrom(null)
                setDragOver(null)
              }}
              onDragEnd={() => {
                setDragFrom(null)
                setDragOver(null)
              }}
              title={editing && onMove ? t("galleryDrag") : undefined}
              style={sized ? { aspectRatio: `${img.w} / ${img.h}` } : undefined}
              className={cn(
                "border-border bg-muted relative m-0 h-full max-w-[85%] shrink-0 snap-start overflow-hidden rounded-lg border",
                !sized && !shown && "w-40",
                dragFrom === i && "opacity-40",
                dragOver === i && dragFrom !== i && "ring-primary ring-2",
              )}
            >
              {editing ? (
                picture
              ) : (
                <button
                  type="button"
                  aria-label={t("galleryOpen", { n: i + 1 })}
                  onClick={(e) => view(i, e.currentTarget)}
                  className="block h-full w-full cursor-zoom-in"
                >
                  {picture}
                </button>
              )}
              {editing && (
                <div className="absolute top-1.5 right-1.5 flex gap-1 transition-opacity sm:opacity-0 sm:group-hover/gallery:opacity-100">
                  <button
                    type="button"
                    data-gallery-control
                    aria-label={t("galleryOpen", { n: i + 1 })}
                    title={t("galleryExpand")}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => view(i, e.currentTarget)}
                    className={cn(round, "size-7")}
                  >
                    <Maximize2 className="size-3.5" />
                  </button>
                  {onRemove && (
                    <button
                      type="button"
                      data-gallery-control
                      aria-label={t("galleryRemove")}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onRemove(i)}
                      className={cn(round, "size-7")}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
            </figure>
          )
        })}
        {editing && onAdd && (
          <button
            type="button"
            data-gallery-control
            onMouseDown={(e) => e.preventDefault()}
            onClick={onAdd}
            className="border-field-border text-muted-foreground hover:text-foreground hover:bg-muted flex h-full w-32 shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs transition-colors"
          >
            <ImagePlus className="size-5" />
            {t("galleryAdd")}
          </button>
        )}
      </div>
      {arrow(-1)}
      {arrow(1)}
      {!lightbox && (
        <ImageLightbox images={images} index={viewing} onIndex={setViewing} />
      )}
    </div>
  )
}
