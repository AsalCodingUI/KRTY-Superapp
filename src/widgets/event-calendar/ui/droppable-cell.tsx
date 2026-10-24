"use client"

import { cx } from "@/shared/lib/utils"
import { useDroppable } from "@dnd-kit/core"
import type { ReactNode } from "react"

interface DroppableCellProps {
  id: string
  children?: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function DroppableCell({
  id,
  children,
  className,
  style,
}: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(
        "transition-colors",
        isOver && "bg-primary/8 ring-primary/40 ring-2",
        className,
      )}
    >
      {children}
    </div>
  )
}
