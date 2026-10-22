import { cn } from "@/lib/utils"
import * as React from "react"

/**
 * Animated show/hide for content under a toggle (list groups, nested nav).
 * Grid rows 0fr <-> 1fr give a height transition without measuring, and a
 * transition (not keyframes) so rapid toggles reverse from where they are.
 * Closed content stays mounted but inert, so it can't be tabbed into.
 */
export function Collapse({
  open,
  className,
  children,
}: {
  open: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-state={open ? "open" : "closed"}
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-[opacity]",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className={cn("min-h-0 overflow-hidden", className)}>{children}</div>
    </div>
  )
}
