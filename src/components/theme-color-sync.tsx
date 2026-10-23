"use client"

import { useEffect } from "react"

/** Any CSS color (oklch, color-mix…) → #rrggbb, which every browser takes. */
function toHex(color: string) {
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
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

    const sync = () => {
      const hex = toHex(getComputedStyle(probe).backgroundColor)
      if (hex && meta!.content !== hex) meta!.content = hex
    }

    sync()
    // Tint lives in html's inline style; light/dark in its class.
    const observer = new MutationObserver(sync)
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    })
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", sync)

    return () => {
      observer.disconnect()
      media.removeEventListener("change", sync)
      probe.remove()
    }
  }, [])

  return null
}
