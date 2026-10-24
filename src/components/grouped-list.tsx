"use client"

import { Collapse } from "@/components/ui/collapse"
import { HoverHighlight } from "@/components/sliding-indicator"
import { cn } from "@/lib/utils"
import { RiArrowDownSLine } from "@/shared/ui/lucide-icons"
import { AnimatePresence, m, type HTMLMotionProps } from "motion/react"
import * as React from "react"

/**
 * Linear-style grouped list: full-bleed group headers ("Menunggu 3") with
 * rows underneath, no column headers. Used where a table would only show
 * status + person + dates.
 */
/** True once the list has mounted: rows added after that animate in. */
const ListMounted = React.createContext(false)
/** False for long lists: rows render as plain divs, without motion. */
const ListAnimated = React.createContext(true)

/** Above this many rows, rows render without per-row motion. */
const ANIMATED_ROW_LIMIT = 50

/**
 * Rough row count: descends through groups, fragments and AnimatePresence;
 * any other element counts as one row.
 */
function countRows(children: React.ReactNode): number {
  let total = 0
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const type = child.type
    if (
      type === ListGroup ||
      type === React.Fragment ||
      type === AnimatePresence
    ) {
      total += countRows(
        (child.props as { children?: React.ReactNode }).children,
      )
    } else total += 1
  })
  return total
}

export function GroupedList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return (
    <div
      data-slot="grouped-list"
      className={cn("bleed relative flex flex-col", className)}
      {...props}
    >
      {/* One hover highlight that follows the pointer between rows. */}
      <HoverHighlight
        itemSelector="[data-slot=list-row]"
        className="bg-(--row-hover)"
      />
      <ListAnimated.Provider value={countRows(children) <= ANIMATED_ROW_LIMIT}>
        <ListMounted.Provider value={mounted}>{children}</ListMounted.Provider>
      </ListAnimated.Provider>
    </div>
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
      <div className="bg-muted/40 gutter-x flex h-10 items-center gap-2 rounded-lg text-sm">
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
            <span className="text-tertiary-foreground tabular-nums">
              {count}
            </span>
          )}
        </button>
        {action}
      </div>
      <Collapse open={open} className="flex flex-col">
        {children}
      </Collapse>
    </section>
  )
}

const ROW_EASE = [0.23, 1, 0.32, 1] as const

// Hover is GroupedList's sliding highlight; rows stay positioned so they
// paint above it.
const listRowClassName =
  "group/row border-border/50 gutter-x relative flex min-h-12 items-center gap-3 border-b py-2 text-sm"

/**
 * A list row. Rows added after the list mounted fade and settle in; inside
 * an `AnimatePresence`, a removed row fades and its height folds away, so
 * the rows below close the gap instead of jumping.
 */
export function ListRow({ className, ...props }: React.ComponentProps<"div">) {
  const enter = React.useContext(ListMounted)
  const animated = React.useContext(ListAnimated)
  if (!animated)
    return (
      <div
        data-slot="list-row"
        className={cn(listRowClassName, className)}
        {...props}
      />
    )
  return (
    <m.div
      data-slot="list-row"
      initial={enter ? { opacity: 0, y: -4 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        height: 0,
        minHeight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        borderBottomWidth: 0,
        overflow: "hidden",
        transition: { duration: 0.2, ease: ROW_EASE },
      }}
      transition={{ duration: 0.2, ease: ROW_EASE }}
      className={cn(listRowClassName, className)}
      {...(props as HTMLMotionProps<"div">)}
    />
  )
}

export const listChipClassName =
  "bg-muted text-muted-foreground inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-[13px] whitespace-nowrap"

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
