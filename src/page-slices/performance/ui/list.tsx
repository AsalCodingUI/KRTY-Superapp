"use client"

import { RollingValue } from "@/components/rolling-value"
import { orEmpty } from "@/components/empty-value"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapse } from "@/components/ui/collapse"
import { cn } from "@/lib/utils"
import { RiArrowDownSLine } from "@/shared/ui/lucide-icons"
import { useT } from "@/shared/i18n/client"
import * as React from "react"

/** Column labels above a list; `grid` is the same template the rows use. */
export function ListColumns({
  grid,
  children,
}: {
  grid: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        grid,
        "gutter-x text-muted-foreground border-border h-9 border-b text-[13px]",
      )}
    >
      {children}
    </div>
  )
}

/** Avatar plus a name / secondary line, the first cell of a person row. */
export function PersonCell({
  name,
  avatarUrl,
  secondary,
  children,
}: {
  name: string | null
  avatarUrl: string | null
  secondary?: React.ReactNode
  /** Replaces the plain name, e.g. a row-covering link. */
  children?: React.ReactNode
}) {
  const t = useT("performance")
  const label = name || t("unknown")
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-7">
        <AvatarImage src={avatarUrl || undefined} alt="" />
        <AvatarFallback className="text-[11px]">
          {label.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        {children ?? <span className="text-foreground truncate">{label}</span>}
        {secondary && (
          <span className="text-tertiary-foreground truncate text-[13px]">
            {secondary}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Collapsible group whose header doubles as a summary: the label sits in the
 * first column, `summary` cells fill the remaining columns of `grid`.
 */
export function GridGroup({
  grid,
  label,
  extra,
  summary,
  defaultOpen = true,
  children,
}: {
  grid: string
  label: React.ReactNode
  /** Next to the label, e.g. a count or badge. */
  extra?: React.ReactNode
  summary?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <section data-state={open ? "open" : "closed"} className="group/day">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          grid,
          "gutter-x focus-visible:ring-focus-ring h-12 w-full rounded-lg text-left text-sm transition-colors outline-none hover:bg-(--row-hover) focus-visible:ring-2",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          <RiArrowDownSLine
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-out",
              !open && "-rotate-90",
            )}
          />
          <span className="text-foreground truncate">{label}</span>
          {extra}
        </span>
        {summary}
      </button>
      <Collapse open={open}>
        <div className="border-border border-t">{children}</div>
      </Collapse>
      <div className="border-border border-b group-data-[state=open]/day:border-transparent" />
    </section>
  )
}

/** Full-bleed stats band under the tabs. */
export function StatBand({
  stats,
  aside,
}: {
  stats: { label: React.ReactNode; value: React.ReactNode }[]
  /** Right-aligned controls, e.g. locking the period. */
  aside?: React.ReactNode
}) {
  return (
    <div className="stat-strip bleed gutter-x border-border border-b py-4">
      {stats.map((item, i) => (
        <div key={i} className="stat-tile">
          <p className="text-muted-foreground text-sm">{item.label}</p>
          <p className="text-foreground text-xl font-normal tracking-tight tabular-nums">
            <RollingValue
              value={
                typeof item.value === "number" || typeof item.value === "string"
                  ? item.value
                  : null
              }
            >
              {orEmpty(item.value)}
            </RollingValue>
          </p>
        </div>
      ))}
      {aside && (
        <div className="ml-auto flex items-center gap-2 self-center">
          {aside}
        </div>
      )}
    </div>
  )
}
