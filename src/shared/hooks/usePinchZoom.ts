"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react"

/**
 * Trackpad pinch-to-zoom on a scroll container, keeping the point under the
 * cursor in place. Two-finger panning is just the container's own scroll.
 *
 * Chrome, Edge and Firefox report a pinch as a wheel event with ctrlKey;
 * Safari sends its own gesture events. Both are cancelled so the page
 * itself doesn't zoom. The content must grow with `zoom` (a width, CSS
 * `zoom`, or a scale with a matching box) for the anchor math to hold.
 *
 * Returns `zoomTo(zoom, clientX?, clientY?)` for buttons; without a point
 * it zooms around the middle of the view.
 */
export function usePinchZoom(
  ref: RefObject<HTMLElement | null>,
  {
    zoom,
    setZoom,
    min = 0.5,
    max = 5,
    enabled = true,
  }: {
    zoom: number
    setZoom: (zoom: number) => void
    min?: number
    max?: number
    enabled?: boolean
  },
) {
  const current = useRef(zoom)
  current.current = zoom
  const setter = useRef(setZoom)
  setter.current = setZoom
  const bounds = useRef({ min, max })
  bounds.current = { min, max }
  // Scroll position to restore once the zoomed content has laid out.
  const pending = useRef<{ left: number; top: number } | null>(null)

  const zoomTo = useCallback(
    (next: number, clientX?: number, clientY?: number) => {
      const el = ref.current
      const from = current.current
      const to = Math.min(
        bounds.current.max,
        Math.max(bounds.current.min, next),
      )
      if (Math.abs(to - from) < 0.001) return
      if (el) {
        const box = el.getBoundingClientRect()
        const ax = (clientX ?? box.left + box.width / 2) - box.left
        const ay = (clientY ?? box.top + box.height / 2) - box.top
        const ratio = to / from
        pending.current = {
          left: (el.scrollLeft + ax) * ratio - ax,
          top: (el.scrollTop + ay) * ratio - ay,
        }
      }
      current.current = to
      setter.current(to)
    },
    [ref],
  )

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      // Trackpads send small steps; a mouse wheel with ctrl sends ~100 a
      // notch, so cap each step to keep that from jumping.
      const step = Math.max(-25, Math.min(25, e.deltaY))
      zoomTo(current.current * Math.exp(-step * 0.01), e.clientX, e.clientY)
    }

    // Safari: GestureEvent isn't in the DOM typings.
    type Gesture = Event & { scale: number; clientX: number; clientY: number }
    let start = 1
    const onGestureStart = (e: Event) => {
      e.preventDefault()
      start = current.current
    }
    const onGestureChange = (e: Event) => {
      e.preventDefault()
      const g = e as Gesture
      zoomTo(start * g.scale, g.clientX, g.clientY)
    }

    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("gesturestart", onGestureStart)
    el.addEventListener("gesturechange", onGestureChange)
    return () => {
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("gesturestart", onGestureStart)
      el.removeEventListener("gesturechange", onGestureChange)
    }
  }, [ref, enabled, zoomTo])

  useLayoutEffect(() => {
    const el = ref.current
    const next = pending.current
    if (!el || !next) return
    pending.current = null
    el.scrollLeft = next.left
    el.scrollTop = next.top
  }, [ref, zoom])

  return zoomTo
}
