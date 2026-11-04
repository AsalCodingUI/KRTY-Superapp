"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { useT } from "@/shared/i18n/client"
import { useEffect, useRef, useState } from "react"
import { renderAvatar } from "../model/avatar"

/** Side of the square crop window, in CSS pixels. */
const VIEW = 256
const MAX_ZOOM = 4

type Loaded = { image: HTMLImageElement; w: number; h: number; src: string }

/**
 * Square crop for a new profile picture: the photo fills the window, drag
 * to move it, the slider (or the wheel / a pinch-less trackpad scroll)
 * zooms. A round mask previews how the avatar will look.
 */
export function AvatarCropDialog({
  file,
  saving,
  onCancel,
  onConfirm,
  onUnreadable,
}: {
  file: File | null
  saving: boolean
  onCancel: () => void
  onConfirm: (picture: Blob) => void
  onUnreadable: () => void
}) {
  const t = useT("profile")
  const tc = useT("common")
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [zoom, setZoom] = useState(1)
  // Top-left of the photo inside the window, CSS px.
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const unreadable = useRef(onUnreadable)
  useEffect(() => {
    unreadable.current = onUnreadable
  })

  useEffect(() => {
    if (!file) return
    let cancelled = false
    const src = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      const w = image.naturalWidth
      const h = image.naturalHeight
      const s = VIEW / Math.min(w, h)
      setLoaded({ image, w, h, src })
      setZoom(1)
      setPos({ x: (VIEW - w * s) / 2, y: (VIEW - h * s) / 2 })
    }
    image.onerror = () => {
      if (!cancelled) unreadable.current()
    }
    image.src = src
    return () => {
      cancelled = true
      URL.revokeObjectURL(src)
      setLoaded(null)
    }
  }, [file])

  const scaleFor = (z: number) =>
    loaded ? (VIEW / Math.min(loaded.w, loaded.h)) * z : 1
  const scale = scaleFor(zoom)

  const clamp = (p: { x: number; y: number }, s: number) => {
    if (!loaded) return p
    return {
      x: Math.min(0, Math.max(VIEW - loaded.w * s, p.x)),
      y: Math.min(0, Math.max(VIEW - loaded.h * s, p.y)),
    }
  }

  /** Zoom around the window's centre. */
  const zoomTo = (next: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, next))
    const s0 = scaleFor(zoom)
    const s1 = scaleFor(z)
    const cx = (VIEW / 2 - pos.x) / s0
    const cy = (VIEW / 2 - pos.y) / s0
    setZoom(z)
    setPos(clamp({ x: VIEW / 2 - cx * s1, y: VIEW / 2 - cy * s1 }, s1))
  }

  const confirm = async () => {
    if (!loaded) return
    const side = VIEW / scale
    try {
      const blob = await renderAvatar(loaded.image, {
        x: -pos.x / scale,
        y: -pos.y / scale,
        side,
      })
      onConfirm(blob)
    } catch {
      onUnreadable()
    }
  }

  return (
    <Dialog
      open={file !== null}
      onOpenChange={(open) => {
        if (!open && !saving) onCancel()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cropTitle")}</DialogTitle>
          <DialogDescription>{t("cropHint")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-5">
          <div
            className="bg-muted relative shrink-0 cursor-grab touch-none overflow-hidden rounded-xl select-none active:cursor-grabbing"
            style={{ width: VIEW, height: VIEW }}
            onPointerDown={(e) => {
              if (!loaded) return
              e.currentTarget.setPointerCapture(e.pointerId)
              drag.current = {
                id: e.pointerId,
                x: e.clientX - pos.x,
                y: e.clientY - pos.y,
              }
            }}
            onPointerMove={(e) => {
              const d = drag.current
              if (!d || d.id !== e.pointerId) return
              setPos(clamp({ x: e.clientX - d.x, y: e.clientY - d.y }, scale))
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onWheel={(e) => zoomTo(zoom - e.deltaY * 0.002)}
          >
            {loaded && (
              // eslint-disable-next-line @next/next/no-img-element -- a local object URL being cropped
              <img
                src={loaded.src}
                alt=""
                draggable={false}
                className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
                style={{
                  width: loaded.w * scale,
                  height: loaded.h * scale,
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                }}
              />
            )}
            {/* The round avatar inside the square crop. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_0_999px_rgb(0_0_0/0.45)] ring-1 ring-white/70"
            />
          </div>
          <label className="flex w-full max-w-64 items-center gap-3">
            <span className="text-muted-foreground shrink-0 text-sm">
              {t("zoom")}
            </span>
            <Slider
              aria-label={t("zoom")}
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={[zoom]}
              disabled={!loaded}
              onValueChange={(v) =>
                zoomTo(Array.isArray(v) ? (v[0] ?? 1) : (v as number))
              }
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={onCancel}>
            {tc("cancel")}
          </Button>
          <Button disabled={!loaded || saving} onClick={confirm}>
            {saving ? tc("saving") : t("usePhoto")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
