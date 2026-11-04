"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CSSProperties, ReactNode } from "react"

/**
 * The building blocks every /ui tab uses, so the tabs look alike:
 * an intro line, a rules table, sections, live examples (with the source
 * file), token swatches and "don't" notes. Keep tabs to these.
 */

/** One line under the tabs: what this tab covers and its doc file. */
export function DocIntro({
  doc,
  children,
}: {
  /** e.g. "typography.md" (docs/ui/…). */
  doc: string
  children: ReactNode
}) {
  return (
    <p className="text-muted-foreground max-w-2xl text-sm">
      {children} Aturan tertulisnya:{" "}
      <code className="font-mono text-xs">docs/ui/{doc}</code>.
    </p>
  )
}

/** A titled section of a tab. */
export function DocGroup({
  title,
  note,
  children,
}: {
  title: string
  note?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading text-lg font-medium tracking-tight">
          {title}
        </h2>
        {note && <p className="text-muted-foreground text-sm">{note}</p>}
      </div>
      {children}
    </section>
  )
}

/** The rules as a label → rule table (same look as the Table tab's). */
export function DocRules({ rules }: { rules: [string, ReactNode][] }) {
  return (
    <div className="bg-muted dark:bg-muted/40 rounded-xl p-1">
      <dl className="bg-background flex flex-col rounded-lg py-1">
        {rules.map(([label, rule]) => (
          <div
            key={label}
            className="gutter-x flex min-h-11 flex-col justify-center gap-0.5 py-2 text-sm sm:flex-row sm:items-center sm:gap-4"
          >
            <dt className="text-muted-foreground w-36 shrink-0 text-[13px]">
              {label}
            </dt>
            <dd className="min-w-0">{rule}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** A live example: its title, the file it lives in, then the thing. */
export function DocExample({
  title,
  source,
  kind = "real",
  children,
  className,
}: {
  title: string
  source?: string
  /** "real": the app's own component; "spec": drawn here to show a rule. */
  kind?: "real" | "spec"
  children: ReactNode
  className?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <Badge variant={kind === "real" ? "secondary" : "info"}>
            {kind === "real" ? "Asli" : "Spesifikasi"}
          </Badge>
        </div>
        {source && (
          <code className="text-muted-foreground font-mono text-xs break-all">
            {source}
          </code>
        )}
      </div>
      <div className={className}>{children}</div>
    </div>
  )
}

/** A framed area to show examples on (the page background inside). */
export function DocCanvas({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "border-border flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-5",
        className,
      )}
    >
      {children}
    </div>
  )
}

/** A token or class with what it's for, e.g. in a scale. */
export function DocToken({
  name,
  value,
  children,
}: {
  /** The class or CSS variable, shown in mono. */
  name: string
  /** Its resolved value, e.g. "14px / 20px". */
  value?: string
  /** A preview of it. */
  children?: ReactNode
}) {
  return (
    <div className="flex min-h-12 flex-col gap-1 py-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex w-56 shrink-0 flex-col">
        <code className="font-mono text-xs">{name}</code>
        {value && (
          <span className="text-tertiary-foreground text-[13px]">{value}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

/** A color swatch for a token (`var(--name)` or a class). */
export function DocSwatch({
  name,
  className,
  style,
  note,
}: {
  name: string
  className?: string
  style?: CSSProperties
  note?: string
}) {
  return (
    <div className="flex w-36 flex-col gap-1.5">
      <div
        className={cn("border-border h-14 rounded-lg border", className)}
        style={style}
      />
      <code className="font-mono text-xs break-all">{name}</code>
      {note && (
        <span className="text-tertiary-foreground text-[12px] leading-4">
          {note}
        </span>
      )}
    </div>
  )
}

/** Mistakes to avoid (the doc's "Don't" list), short. */
export function DocDont({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-destructive shrink-0">✕</span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  )
}
