"use client"

import { useDndMonitor, type DragMoveEvent } from "@dnd-kit/core"
import { useEffect, useRef, useState } from "react"

/** Degrees the lifted card leans per px/ms of sideways speed, and the cap. */
const TILT_PER_SPEED = 6
const TILT_MAX = 8

/**
 * How far the lifted card leans into a sideways move, settling when it
 * stops. Lives in the drag overlay (inside the DndContext), so a pointer
 * move re-renders only the lifted card, not the whole board.
 */
export function useDragTilt() {
  const [tilt, setTilt] = useState(0)
  const lastMove = useRef<{ x: number; t: number } | null>(null)
  const settle = useRef<number | undefined>(undefined)
  const reset = () => {
    window.clearTimeout(settle.current)
    lastMove.current = null
    setTilt(0)
  }
  useDndMonitor({
    onDragMove: ({ delta }: DragMoveEvent) => {
      const now = performance.now()
      const last = lastMove.current
      lastMove.current = { x: delta.x, t: now }
      if (!last || now === last.t) return
      const speed = (delta.x - last.x) / (now - last.t)
      setTilt(Math.max(-TILT_MAX, Math.min(TILT_MAX, speed * TILT_PER_SPEED)))
      window.clearTimeout(settle.current)
      settle.current = window.setTimeout(() => setTilt(0), 90)
    },
    onDragStart: reset,
    onDragEnd: reset,
    onDragCancel: reset,
  })
  useEffect(() => () => window.clearTimeout(settle.current), [])
  return tilt
}
