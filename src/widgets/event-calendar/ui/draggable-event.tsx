"use client"

import { cx } from "@/shared/lib/utils"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"
import type { CalendarEvent } from "./types"

interface DraggableEventProps {
  event: CalendarEvent
  children: ReactNode
  disabled?: boolean
}

export function DraggableEvent({
  event,
  children,
  disabled = false,
}: DraggableEventProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: event.id,
      disabled,
    })

  const style = {
    transform: CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!disabled ? attributes : {})}
      {...(!disabled ? listeners : {})}
      className={cx(
        !disabled && "cursor-grab active:cursor-grabbing",
        isDragging && "z-50 opacity-50",
      )}
    >
      {children}
    </div>
  )
}
