import { cn } from "@/lib/utils"
import type * as React from "react"

/**
 * A card on a board (projects kanban, task board): meta line, title,
 * people row. One look for every board (docs/ui/components.md).
 *
 * Draggable cards carry no grip icon (it sat on top of the meta line):
 * the wrapper's `cursor-grab` plus a small lift on hover (border + a
 * control shadow) say it can be picked up; while dragged it floats
 * (`shadow-popover`). Put the drag listeners and `group/card` on the
 * wrapper around it.
 */
export function BoardCard({
  draggable = false,
  lifted = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** Can be picked up: hover lifts it a little. */
  draggable?: boolean
  /** Being dragged (the drag overlay). */
  lifted?: boolean
}) {
  return (
    <div
      data-slot="board-card"
      className={cn(
        "bg-card border-border group-hover/card:border-field-border rounded-nested relative flex flex-col gap-1.5 border px-3.5 py-3 text-sm transition-[border-color,box-shadow] duration-200",
        draggable && !lifted && "group-hover/card:shadow-control",
        lifted && "shadow-popover border-transparent",
        className,
      )}
      {...props}
    />
  )
}
