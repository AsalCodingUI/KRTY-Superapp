"use client"

import { cn } from "@/lib/utils"
import { RiArrowDownSLine } from "@/shared/ui/lucide-icons"
import * as React from "react"

/**
 * Linear-style grouped list: full-bleed group headers ("Menunggu 3") with
 * rows underneath, no column headers. Used where a table would only show
 * status + person + dates.
 */
export function GroupedList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="grouped-list"
      className={cn("-mx-4 flex flex-col", className)}
      {...props}
    />
  )
}

export function ListGroup({
  label,
  icon,
  count,
  action,
  defaultOpen = true,
  children,
}: {
  label: React.ReactNode
  icon?: React.ReactNode
  count?: React.ReactNode
  /** Right side of the header, e.g. "Setujui semua". */
  action?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <section data-slot="list-group" data-open={open || undefined}>
      <div className="bg-muted/40 flex h-10 items-center gap-2 px-4 text-sm">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none"
        >
          <RiArrowDownSLine
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform",
              !open && "-rotate-90",
            )}
          />
          {icon}
          <span className="truncate font-medium">{label}</span>
          {count !== undefined && (
            <span className="text-muted-foreground tabular-nums">{count}</span>
          )}
        </button>
        {action}
      </div>
      {open && <div className="flex flex-col">{children}</div>}
    </section>
  )
}

export function ListRow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-row"
      className={cn(
        "group/row border-border/50 hover:bg-muted/30 flex min-h-12 items-center gap-3 border-b px-4 py-2 text-sm",
        className,
      )}
      {...props}
    />
  )
}

export const listChipClassName =
  "bg-muted text-muted-foreground inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs whitespace-nowrap"

/** Small borderless chip for row metadata (type, dates, notes). */
export function ListChip({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="list-chip"
      className={cn(listChipClassName, className)}
      {...props}
    />
  )
}

/** Actions that appear on row hover (and stay while focused). */
export function ListRowActions({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100",
        className,
      )}
      {...props}
    />
  )
}
