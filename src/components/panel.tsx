import { GroupedList } from "@/components/grouped-list"
import { cn } from "@/lib/utils"
import * as React from "react"

/** The card surface every bordered block uses (HomeCard, Panel, stats). */
export const surfaceClassName =
  "bg-card border-field-border dark:border-border rounded-card border"

/**
 * A bordered section on a page: header (title, count, action) over a body.
 * The standard container for dashboard blocks, so sections never float.
 */
export function Panel({
  title,
  meta,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: React.ReactNode
  /** Small tertiary note next to the title, e.g. an item count. */
  meta?: React.ReactNode
  /** Right side of the header, e.g. a "see all" link. */
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        surfaceClassName,
        "flex min-w-0 flex-col overflow-hidden",
        className,
      )}
    >
      <header className="border-border flex h-11 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="text-heading truncate text-sm font-medium">{title}</h2>
          {meta !== undefined && meta !== null && (
            <span className="text-tertiary-foreground text-meta tabular-nums">
              {meta}
            </span>
          )}
        </div>
        {action}
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col", bodyClassName)}>
        {children}
      </div>
    </section>
  )
}

/**
 * A list inside a panel: the standard rows (`ListRow`, or elements with
 * `data-slot="list-row"` + `listRowClassName`) and GroupedList's sliding
 * highlight. The rows bleed 8px into the body's 16px padding, so the
 * highlight sits inset from the edge and the text lines up with the
 * header's title.
 */
export function PanelList({
  className,
  ...props
}: React.ComponentProps<typeof GroupedList>) {
  return (
    <div className="px-4 py-2">
      <GroupedList className={cn("[--bleed:0.5rem]", className)} {...props} />
    </div>
  )
}

/** Compact empty message for inside a panel. */
export function PanelEmpty({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
}) {
  return (
    <div className="enter-rise flex flex-1 flex-col items-center justify-center gap-1 px-6 py-8 text-center">
      {icon && (
        <span className="text-tertiary-foreground mb-1 [&_svg]:size-5">
          {icon}
        </span>
      )}
      <p className="text-foreground text-sm font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground text-meta max-w-xs text-balance">
          {description}
        </p>
      )}
    </div>
  )
}
