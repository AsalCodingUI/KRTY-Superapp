"use client"

import { cn } from "@/lib/utils"
import * as React from "react"

type Box = { x: number; y: number; w: number; h: number }

/**
 * The active-item highlight of a segmented control / tab row, drawn once and
 * slid to whichever item is active (Emil Kowalski: animate the shared
 * indicator, not each item). Place it as the first child of a `relative`
 * container whose items are `relative` too, so they paint above it. It
 * measures against its own parent element (a parent's ref isn't attached yet
 * when a child's layout effect runs).
 *
 * It finds the active item with `activeSelector` and follows it: on clicks
 * (attribute changes), resizes and font loads. The first placement doesn't
 * animate, so nothing slides in from the corner on mount. Transform-based,
 * strong ease-out, off under reduced motion.
 */
export function SlidingIndicator({
  activeSelector,
  className,
  /** "fill" covers the item; "underline" is a bar along its bottom edge. */
  variant = "fill",
}: {
  activeSelector: string
  className?: string
  variant?: "fill" | "underline"
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [box, setBox] = React.useState<Box | null>(null)
  const [animate, setAnimate] = React.useState(false)

  React.useLayoutEffect(() => {
    const container = ref.current?.parentElement
    if (!container) return

    const measure = () => {
      const active = container.querySelector<HTMLElement>(activeSelector)
      if (!active) {
        setBox(null)
        return
      }
      const c = container.getBoundingClientRect()
      const a = active.getBoundingClientRect()
      // Rects include ancestor transforms: a dialog opening at scale(0.95)
      // would leave the pill 5% short, and nothing re-measures once the
      // animation ends. Divide the scale back out to get layout pixels.
      const sx = container.offsetWidth ? c.width / container.offsetWidth : 1
      const sy = container.offsetHeight ? c.height / container.offsetHeight : 1
      setBox((prev) => {
        const next = {
          x: (a.left - c.left) / sx - container.clientLeft,
          y: (a.top - c.top) / sy - container.clientTop,
          w: a.width / sx,
          h: a.height / sy,
        }
        return prev &&
          prev.x === next.x &&
          prev.y === next.y &&
          prev.w === next.w &&
          prev.h === next.h
          ? prev
          : next
      })
    }

    measure()
    // Turn transitions on only after the first placement has painted
    // (the timeout covers background tabs, where frames are throttled).
    const enable = () => setAnimate(true)
    const frame = requestAnimationFrame(() => requestAnimationFrame(enable))
    const timer = window.setTimeout(enable, 120)

    const resize = new ResizeObserver(measure)
    resize.observe(container)
    for (const child of Array.from(container.children)) resize.observe(child)
    const mutations = new MutationObserver(measure)
    mutations.observe(container, {
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-pressed",
        "data-active",
        "data-state",
        "aria-pressed",
        "aria-checked",
        "aria-selected",
        "aria-current",
      ],
    })
    document.fonts?.ready.then(measure).catch(() => {})

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      resize.disconnect()
      mutations.disconnect()
    }
  }, [activeSelector])

  const underline = variant === "underline"
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-0",
        !box && "invisible",
        animate &&
          "transition-[transform,width,height] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
        className,
      )}
      style={
        box
          ? {
              width: box.w,
              height: underline ? undefined : box.h,
              transform: underline
                ? `translate(${box.x}px, ${box.y + box.h}px)`
                : `translate(${box.x}px, ${box.y}px)`,
            }
          : undefined
      }
    />
  )
}

/**
 * Row hover as one highlight that follows the pointer from row to row
 * (instead of each row lighting up on its own). It fades in where the
 * pointer enters, slides between rows while inside, and fades out on leave.
 * Mouse only; place it as the first child of a `relative` list whose rows
 * are positioned so they paint above it. `inset` trims the top and bottom so
 * it clears row dividers.
 */
export function HoverHighlight({
  itemSelector,
  className,
  inset = 2,
}: {
  itemSelector: string
  className?: string
  inset?: number
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [box, setBox] = React.useState<Box | null>(null)
  const [visible, setVisible] = React.useState(false)
  // Jump (no slide) when appearing, so it never glides in from an old row.
  const [instant, setInstant] = React.useState(true)

  React.useEffect(() => {
    const container = ref.current?.parentElement
    if (!container) return
    let shown = false

    const place = (row: HTMLElement) => {
      const c = container.getBoundingClientRect()
      const r = row.getBoundingClientRect()
      setBox({
        x: r.left - c.left - container.clientLeft,
        y: r.top - c.top - container.clientTop + inset,
        w: r.width,
        h: Math.max(0, r.height - inset * 2),
      })
    }

    const onOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return
      const row = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        itemSelector,
      )
      if (!row || !container.contains(row)) {
        if (shown) {
          shown = false
          setVisible(false)
        }
        return
      }
      if (!shown) {
        shown = true
        setInstant(true)
        place(row)
        setVisible(true)
        requestAnimationFrame(() => setInstant(false))
      } else {
        place(row)
      }
    }
    const onLeave = () => {
      shown = false
      setVisible(false)
    }

    container.addEventListener("pointerover", onOver)
    container.addEventListener("pointerleave", onLeave)
    return () => {
      container.removeEventListener("pointerover", onOver)
      container.removeEventListener("pointerleave", onLeave)
    }
  }, [itemSelector, inset])

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute top-0 left-0 rounded-lg transition-opacity duration-150 ease-out motion-reduce:transition-none",
        !instant &&
          "transition-[opacity,transform,height] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
        visible && box ? "opacity-100" : "opacity-0",
        className,
      )}
      style={
        box
          ? {
              width: box.w,
              height: box.h,
              transform: `translate(${box.x}px, ${box.y}px)`,
            }
          : undefined
      }
    />
  )
}
