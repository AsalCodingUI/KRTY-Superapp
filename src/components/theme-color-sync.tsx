"use client"

import { applyTint, readTint } from "@/shared/lib/chrome-tint"
import { useEffect, useLayoutEffect } from "react"

// One shared 1×1 canvas for color conversion (created on first use).
let ctx: CanvasRenderingContext2D | null | undefined

/** Any CSS color (oklch, color-mix…) → #rrggbb, which every browser takes. */
function toHex(color: string) {
  if (ctx === undefined) {
    const canvas = document.createElement("canvas")
    canvas.width = canvas.height = 1
    ctx = canvas.getContext("2d", { willReadFrequently: true })
  }
  if (!ctx) return null
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

/**
 * Keeps <meta name="theme-color"> equal to the app chrome, so Safari's
 * toolbar (and mobile browser bars) take the same color as the top bar.
 * Follows the chrome tint, light/dark and the OS theme as they change.
 */
export function ThemeColorSync() {
  // Hydrating <html> drops the inline tint TINT_SCRIPT set before paint;
  // put it back before the browser paints the hydrated page.
  useLayoutEffect(() => applyTint(readTint()), [])

  useEffect(() => {
    const root = document.documentElement
    // A hidden probe resolves var(--chrome) to a concrete color.
    const probe = document.createElement("span")
    probe.setAttribute("aria-hidden", "true")
    probe.style.cssText =
      "position:fixed;width:0;height:0;visibility:hidden;pointer-events:none;background-color:var(--chrome)"
    document.body.appendChild(probe)

    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    )
    if (!meta) {
      meta = document.createElement("meta")
      meta.name = "theme-color"
      document.head.appendChild(meta)
    }

    let lastColor = ""
    const sync = () => {
      const color = getComputedStyle(probe).backgroundColor
      if (color === lastColor) return
      lastColor = color
      const hex = toHex(color)
      if (hex && meta!.content !== hex) meta!.content = hex
    }
    // Coalesce bursts (e.g. dragging the appearance slider) to one per frame.
    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        sync()
      })
    }

    sync()
    // Tint lives in html's inline style; light/dark in its class.
    const observer = new MutationObserver(schedule)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    })
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", schedule)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      media.removeEventListener("change", schedule)
      probe.remove()
    }
  }, [])

  return null
}
