import { PageHeader } from "@/components/page-header"
import { surfaceClassName } from "@/components/panel"
import { RollingValue } from "@/components/rolling-value"
import { HoverHighlight } from "@/components/sliding-indicator"
import { orEmpty } from "@/components/empty-value"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ChevronRight } from "@/components/icons"
import Link from "next/link"
import * as React from "react"
import { useT } from "@/shared/i18n/client"

/**
 * Home building blocks (Mercury-style layout, our components): roomy cards
 * with the title inside, stat columns, and a footer line that links on.
 */

/** Full-width column on the page gutter, like every other page. */
export function HomeColumn({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-4 pt-6">{children}</div>
}

/** The page's h1 is PageHeader's; HomeColumn's pt-6 / gap-4 space it. */
export function HomeGreeting({ title }: { title: React.ReactNode }) {
  return <PageHeader title={title} className="pt-0 pb-0" />
}

/** Row of quick-action pills; the first one is usually primary. On a
 *  phone the pills scroll sideways edge to edge and the aside (period
 *  filters) is left out, with the cards it filters. */
export function HomeActions({
  children,
  aside,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="max-md:bleed max-md:gutter-x flex items-center gap-2 max-md:w-[calc(100%+2*var(--page-gutter,1rem))] max-md:overflow-x-auto max-md:[scrollbar-width:none] md:flex-wrap [&>*]:shrink-0">
        {children}
      </div>
      {aside && (
        <div className="flex items-center gap-2 max-md:hidden">{aside}</div>
      )}
    </div>
  )
}

export function HomeAction({
  href,
  onClick,
  icon,
  primary = false,
  desktopOnly = false,
  children,
}: {
  href?: string
  onClick?: () => void
  icon?: React.ReactNode
  primary?: boolean
  /** Leads to a part of the app that phones leave out. */
  desktopOnly?: boolean
  children: React.ReactNode
}) {
  const className = desktopOnly ? "max-md:hidden" : undefined
  const content = (
    <>
      {icon && (
        <span data-icon="inline-start" className="flex items-center">
          {icon}
        </span>
      )}
      {children}
    </>
  )
  const variant = primary ? "default" : "outline"
  if (href)
    return (
      <Button
        variant={variant}
        size="lg"
        className={className}
        nativeButton={false}
        render={<Link href={href} prefetch={false} />}
      >
        {content}
      </Button>
    )
  return (
    <Button variant={variant} size="lg" className={className} onClick={onClick}>
      {content}
    </Button>
  )
}

/** Two cards side by side on wide screens. */
export function HomeGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2", className)}>
      {children}
    </div>
  )
}

/** `data-*` attributes (a right-click target: <ContextTarget>). */
type DataProps = { [key: `data-${string}`]: unknown }

export function HomeCard({
  title,
  badge,
  actions,
  className,
  children,
  ...data
}: {
  title: React.ReactNode
  badge?: React.ReactNode
  /** Small icon buttons / links in the top right. */
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
} & DataProps) {
  return (
    <section
      {...data}
      className={cn(
        surfaceClassName,
        "p-surface relative flex min-w-0 flex-col gap-4",
        className,
      )}
    >
      {/* One hover highlight that follows the pointer between the card's
          clickable rows (HomeRow with href / onClick), like GroupedList. */}
      <HoverHighlight
        itemSelector="[data-slot=home-row][data-interactive]"
        className="bg-(--row-hover)"
      />
      <header className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-heading text-title truncate font-normal">
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
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className="text-muted-foreground"
            nativeButton={false}
            render={<Link href={href} prefetch={false} />}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Big headline figure, e.g. "8 / 11" with a unit. */
export function HomeFigure({
  value,
  unit,
  hint,
  roll = true,
}: {
  value: React.ReactNode
  unit?: React.ReactNode
  hint?: React.ReactNode
  /** Off for a live value like a clock: a roll on every tick (and on the
   *  first fill-in) only gets in the way. */
  roll?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-heading text-kpi leading-none font-normal tabular-nums">
        {roll ? (
          <RollingValue
            value={
              typeof value === "number" || typeof value === "string"
                ? value
                : null
            }
          >
            {orEmpty(value)}
          </RollingValue>
        ) : (
          orEmpty(value)
        )}
        {unit && (
          <span className="text-muted-foreground ml-1.5 text-base font-normal tracking-normal">
            {unit}
          </span>
        )}
      </p>
      {hint && <p className="text-muted-foreground text-meta">{hint}</p>}
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
          <dt className="text-muted-foreground text-meta truncate">
            {item.label}
          </dt>
          <dd
            className={cn(
              "truncate text-base font-normal tabular-nums",
              item.tone,
            )}
          >
            <RollingValue
              value={
                typeof item.value === "number" || typeof item.value === "string"
                  ? item.value
                  : null
              }
            >
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
  linkLabel,
}: {
  label: string
  value: React.ReactNode
  href: string
  linkLabel?: string
}) {
  const t = useT("dashboard")
  return (
    <div className="border-border mt-auto flex items-end justify-between gap-3 border-t pt-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-muted-foreground text-meta">{label}</span>
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
        {linkLabel ?? t("footerView")}
        <ChevronRight data-icon="inline-end" />
      </Button>
    </div>
  )
}

/** A list row inside a card (avatar/icon, text, right value). The table
 *  row heights (min-h-12, min-h-14 with a subtitle), py-2; hover is the
 *  card's sliding highlight, not a per-row colour. */
export function HomeRow({
  href,
  onClick,
  leading,
  title,
  subtitle,
  trailing,
  className: extra,
  ...data
}: {
  href?: string
  /** Makes the row a button (e.g. open an edit dialog). */
  onClick?: () => void
  leading?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
} & DataProps) {
  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{title}</p>
        {subtitle && (
          <p className="text-muted-foreground text-meta truncate">{subtitle}</p>
        )}
      </div>
      {trailing && (
        <div className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
          {trailing}
        </div>
      )}
    </>
  )
  // -mx-2 px-2: the highlight is a little wider than the text, in the
  // card's padding.
  const className = cn(
    "rounded-row relative -mx-2 flex items-center gap-3 px-2 py-2 text-left",
    subtitle ? "min-h-14" : "min-h-12",
    (href || onClick) &&
      "focus-visible:ring-focus-ring outline-none focus-visible:ring-2",
    extra,
  )
  if (href)
    return (
      <Link
        {...data}
        data-slot="home-row"
        data-interactive=""
        href={href}
        prefetch={false}
        className={className}
      >
        {body}
      </Link>
    )
  if (onClick)
    return (
      <button
        {...data}
        type="button"
        data-slot="home-row"
        data-interactive=""
        onClick={onClick}
        className={className}
      >
        {body}
      </button>
    )
  return (
    <div {...data} data-slot="home-row" className={className}>
      {body}
    </div>
  )
}

export function HomeEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground flex min-h-24 flex-1 items-center justify-center text-center text-sm">
      {children}
    </p>
  )
}
