import { cn } from "@/lib/utils"
import Link from "next/link"
import * as React from "react"

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
  /** Right side of the header, usually a PanelLink. */
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "bg-card border-field-border dark:border-border flex min-w-0 flex-col overflow-hidden rounded-xl border",
        className,
      )}
    >
      <header className="border-border flex h-11 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="text-heading truncate text-sm font-medium">{title}</h2>
          {meta !== undefined && meta !== null && (
            <span className="text-tertiary-foreground text-[13px] tabular-nums">
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

/** "Lihat semua →" style link for a panel header. */
export function PanelLink({
  href,
  children = "Lihat semua",
}: {
  href: string
  children?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="text-muted-foreground hover:text-foreground shrink-0 text-[13px] font-medium transition-colors"
    >
      {children} →
    </Link>
  )
}

/** One row in a panel list; links get a hover surface. */
export function PanelRow({
  href,
  className,
  children,
}: {
  href?: string
  className?: string
  children: React.ReactNode
}) {
  const classes = cn(
    "border-border flex min-h-12 shrink-0 items-center gap-3 border-b px-4 py-2.5 last:border-b-0",
    href && "hover:bg-accent/60 transition-colors",
    className,
  )
  if (href)
    return (
      <Link href={href} prefetch={false} className={classes}>
        {children}
      </Link>
    )
  return <div className={classes}>{children}</div>
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
        <p className="text-muted-foreground max-w-xs text-[13px] text-balance">
          {description}
        </p>
      )}
    </div>
  )
}
