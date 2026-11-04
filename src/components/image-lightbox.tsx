"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { ChevronLeft, ChevronRight, X } from "@/components/icons"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

export type LightboxImage = { src: string; alt: string }

/**
 * The pictures a document's lightbox steps through, in document order:
 * any marked `data-lightbox` (gallery tiles, `<Markdown>` pictures) and
 * the editor's own pictures (`.doc-image img`).
 */
export const LIGHTBOX_IMAGES = "img[data-lightbox], .doc-image img"

type Lightbox = {
  /** Opens at this picture (an element in the scope, or its URL). */
  open: (target: HTMLImageElement | string) => void
}

const LightboxContext = createContext<Lightbox | null>(null)

/** The document's lightbox, when inside a <LightboxScope>. */
export const useLightbox = () => useContext(LightboxContext)

const urlOf = (img: HTMLImageElement) =>
  img.getAttribute("data-lightbox-src") || img.currentSrc || img.src

/**
 * One lightbox for a document (the editor, read-only or not, or
 * `<Markdown images>`): whichever picture is opened, the arrows step
 * through all the document's pictures, galleries included, with "2 / 5".
 * `root` is the document's element, read when a picture opens.
 */
export function LightboxScope({
  root,
  children,
}: {
  root: () => Element | null | undefined
  children: ReactNode
}) {
  const rootRef = useRef(root)
  rootRef.current = root
  const [state, setState] = useState<{
    images: LightboxImage[]
    index: number
  } | null>(null)

  const open = useCallback((target: HTMLImageElement | string) => {
    const els = [
      ...(rootRef
        .current()
        ?.querySelectorAll<HTMLImageElement>(LIGHTBOX_IMAGES) ?? []),
    ]
    const images = els.map((el) => ({ src: urlOf(el), alt: el.alt }))
    let index =
      typeof target === "string"
        ? images.findIndex((i) => i.src === target)
        : els.indexOf(target)
    if (index < 0) {
      // Not in the document (yet): just that one.
      const src = typeof target === "string" ? target : urlOf(target)
      const alt = typeof target === "string" ? "" : target.alt
      images.splice(0, images.length, { src, alt })
      index = 0
    }
    setState({ images, index })
  }, [])

  const value = useMemo(() => ({ open }), [open])
  return (
    <LightboxContext.Provider value={value}>
      {children}
      <ImageLightbox
        images={state?.images ?? []}
        index={state?.index ?? null}
        onIndex={(i) =>
          setState((s) => (s && i !== null ? { ...s, index: i } : null))
        }
      />
    </LightboxContext.Provider>
  )
}

/**
 * Pictures large, over everything: fit to the screen on a dark veil,
 * arrows (and ← →, and a swipe on a phone) for the others with "2 / 5",
 * Esc, the close button or a click beside the picture closes. Works inside
 * another dialog.
 */
export function ImageLightbox({
  images,
  index,
  onIndex,
}: {
  images: LightboxImage[]
  index: number | null
  onIndex: (i: number | null) => void
}) {
  const t = useT("policies")
  const tc = useT("common")
  const open = index !== null && index < images.length
  const current = open ? images[index] : null
  const go = (dir: 1 | -1) => {
    if (index === null || images.length < 2) return
    onIndex((index + dir + images.length) % images.length)
  }
  const touch = useRef<number | null>(null)
  const goRef = useRef(go)
  goRef.current = go
  // ← → wherever the focus is while it's open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goRef.current(-1)
      else if (e.key === "ArrowRight") goRef.current(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])
  const nav =
    "absolute grid place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onIndex(null)
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          // Shown inside another dialog too (Base UI skips nested ones).
          forceRender
          className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 z-lightbox fixed inset-0 bg-black/85 duration-200"
        />
        <DialogPrimitive.Popup
          className="data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 z-lightbox fixed inset-0 flex items-center justify-center p-4 duration-200 outline-none sm:p-14"
          onTouchStart={(e) => {
            touch.current = e.touches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            const start = touch.current
            const end = e.changedTouches[0]?.clientX
            touch.current = null
            if (start == null || end == null || Math.abs(end - start) < 40)
              return
            go(end < start ? 1 : -1)
          }}
          onClick={(e) => {
            // A click beside the picture closes it.
            if (e.target === e.currentTarget) onIndex(null)
          }}
        >
          <DialogPrimitive.Title className="sr-only">
            {current?.alt || t("galleryOpen", { n: (index ?? 0) + 1 })}
          </DialogPrimitive.Title>
          {current && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current.src}
              src={current.src}
              alt={current.alt}
              className="shadow-dialog max-h-full max-w-full rounded-lg object-contain"
            />
          )}
          <DialogPrimitive.Close
            aria-label={tc("close")}
            className={cn(nav, "top-3 right-3 size-9")}
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label={t("galleryPrev")}
                onClick={() => go(-1)}
                className={cn(nav, "left-3 size-10")}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label={t("galleryNext")}
                onClick={() => go(1)}
                className={cn(nav, "right-3 size-10")}
              >
                <ChevronRight className="size-5" />
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80 tabular-nums">
                {(index ?? 0) + 1} / {images.length}
              </span>
            </>
          )}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * A single picture (`<Markdown images>`) that opens large on a click: in
 * its document's lightbox when there is one, else on its own.
 */
export function ZoomableImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const lightbox = useLightbox()
  const [open, setOpen] = useState(false)
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        data-lightbox
        onClick={(e) =>
          lightbox ? lightbox.open(e.currentTarget) : setOpen(true)
        }
        className={cn("cursor-zoom-in", className)}
      />
      {!lightbox && (
        <ImageLightbox
          images={[{ src, alt }]}
          index={open ? 0 : null}
          onIndex={(i) => setOpen(i !== null)}
        />
      )}
    </>
  )
}
