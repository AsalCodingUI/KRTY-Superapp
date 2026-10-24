"use client"

import { useEffect } from "react"

/** How long the thumb stays after the last scroll event. */
const HIDE_AFTER_MS = 900

/**
 * macOS-style overlay scrollbars everywhere: the thumb is invisible until its
 * container scrolls, then fades out shortly after. Marks the scrolling
 * element with `data-scrolling`; globals.css paints the thumb only there.
 */
export function ScrollbarAutoHide() {
  useEffect(() => {
    const timers = new Map<Element, number>()

    const onScroll = (e: Event) => {
      const target = e.target === document ? document.documentElement : e.target
      if (!(target instanceof Element)) return
      if (!target.hasAttribute("data-scrolling")) {
        target.setAttribute("data-scrolling", "")
      }
      window.clearTimeout(timers.get(target))
      timers.set(
        target,
        window.setTimeout(() => {
          target.removeAttribute("data-scrolling")
          timers.delete(target)
        }, HIDE_AFTER_MS),
      )
    }

    // Scroll doesn't bubble; capture sees every scroller on the page.
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    })
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true })
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return null
}
