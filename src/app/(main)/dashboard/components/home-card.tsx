import { RollingValue } from "@/components/rolling-value"
import { orEmpty } from "@/components/empty-value"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import * as React from "react"

/**
 * Home building blocks (Mercury-style layout, our components): roomy cards
 * with the title inside, stat columns, and a footer line that links on.
 */

/** Full-width column on the page gutter, like every other page. */
export function HomeColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-4 pt-6 pb-10">
      {children}
    </div>
  )
}

export function HomeGreeting({ title }: { title: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-heading text-2xl font-normal tracking-tight">
        {title}
      </h1>
    </div>
  )
}

/** Row of quick-action pills; the first one is usually primary. */
export function HomeActions({
  children,
  aside,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {aside && <div className="flex items-center gap-2">{aside}</div>}
    </div>
  )
}

export function HomeAction({
  href,
  onClick,
  icon,
  primary = false,
  children,
}: {
  href?: string
  onClick?: () => void
  icon?: React.ReactNode
  primary?: boolean
  children: React.ReactNode
}) {
  const content = (
    <>
      {icon && <span data-icon="inline-start">{icon}</span>}
      {children}
    </>
  )
  const variant = primary ? "default" : "outline"
  if (href)
    return (
      <Button
        variant={variant}
        size="lg"
        nativeButton={false}
        render={<Link href={href} prefetch={false} />}
      >
        {content}
      </Button>
    )
  return (
    <Button variant={variant} size="lg" onClick={onClick}>
      {content}
    </Button>
  )
}

/** Two cards side by side on wide screens. */
export function HomeGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
}

export function HomeCard({
  title,
  badge,
  actions,
  className,
  children,
}: {
  title: React.ReactNode
  badge?: React.ReactNode
  /** Small icon buttons / links in the top right. */
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "bg-card border-field-border dark:border-border flex min-w-0 flex-col gap-4 rounded-xl border p-5",
        className,
      )}
    >
      <header className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-heading truncate text-[15px] font-normal">
            {title}
          </h2>
          {badge}
        </div>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </header>
      {children}
    </section>
  )
}

/** Small icon button for a card header (open the related page). */
export function HomeIconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      className="text-muted-foreground"
      nativeButton={false}
      render={<Link href={href} prefetch={false} />}
    >
      {children}
    </Button>
  )
}

/** Big headline figure, e.g. "8 / 11" with a unit. */
export function HomeFigure({
  value,
  unit,
  hint,
}: {
  value: React.ReactNode
  unit?: React.ReactNode
  hint?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-heading text-[1.75rem] leading-none font-normal tracking-tight tabular-nums">
        <RollingValue value={typeof value === "number" || typeof value === "string" ? value : null}>{orEmpty(value)}</RollingValue>
        {unit && (
          <span className="text-muted-foreground ml-1.5 text-base font-normal tracking-normal">
            {unit}
          </span>
        )}
      </p>
      {hint && <p className="text-muted-foreground text-[13px]">{hint}</p>}
    </div>
  )
}

/** Label-over-value columns; a quiet dash when there is nothing yet. */
export function HomeStats({
  items,
}: {
  items: { label: string; value: React.ReactNode; tone?: string }[]
}) {
  return (
    <dl
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item) => (
        <div key={item.label} className="flex min-w-0 flex-col gap-1">
          <dt className="text-muted-foreground truncate text-[13px]">
            {item.label}
          </dt>
          <dd
            className={cn(
              "truncate text-base font-normal tabular-nums",
              item.tone,
            )}
          >
            <RollingValue value={typeof item.value === "number" || typeof item.value === "string" ? item.value : null}>
              {orEmpty(item.value)}
            </RollingValue>
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Divider + "Label / value ...... Lihat >" line closing a card. */
export function HomeFooter({
  label,
  value,
  href,
  linkLabel = "Lihat",
}: {
  label: string
  value: React.ReactNode
  href: string
  linkLabel?: string
}) {
  return (
    <div className="border-border mt-auto flex items-end justify-between gap-3 border-t pt-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-muted-foreground text-[13px]">{label}</span>
        <span className="truncate text-sm font-normal tabular-nums">
          {value}
        </span>
      </div>
      <Button
        variant="link"
        size="sm"
        className="h-auto shrink-0 px-0"
        nativeButton={false}
        render={<Link href={href} prefetch={false} />}
      >
        {linkLabel}
        <ChevronRight data-icon="inline-end" />
      </Button>
    </div>
  )
}

/** A list row inside a card (avatar/icon, text, right value). */
export function HomeRow({
  href,
  leading,
  title,
  subtitle,
  trailing,
}: {
  href?: string
  leading?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
}) {
  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{title}</p>
        {subtitle && (
          <p className="text-muted-foreground truncate text-[13px]">
            {subtitle}
          </p>
        )}
      </div>
      {trailing && (
        <div className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
          {trailing}
        </div>
      )}
    </>
  )
  const className =
    "-mx-2 flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5"
  if (href)
    return (
      <Link
        href={href}
        prefetch={false}
        className={cn(className, "hover:bg-accent/60 transition-colors")}
      >
        {body}
      </Link>
    )
  return <div className={className}>{body}</div>
}

export function HomeEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground flex min-h-24 flex-1 items-center justify-center text-center text-sm">
      {children}
    </p>
  )
}
