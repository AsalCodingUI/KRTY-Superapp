"use client"

import {
  listGroupHeaderClassName,
  listHeaderClassName,
} from "@/components/grouped-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapse } from "@/components/ui/collapse"
import { cn } from "@/lib/utils"
import { RiArrowDownSLine } from "@/shared/ui/lucide-icons"
import { useT } from "@/shared/i18n/client"
import * as React from "react"
import { initials } from "@/shared/lib/initials"

/** Column labels above a list; `grid` is the same template the rows use. */
export function ListColumns({
  grid,
  children,
}: {
  grid: string
  children: React.ReactNode
}) {
  return <div className={cn(grid, listHeaderClassName)}>{children}</div>
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
      <Avatar size="md">
        <AvatarImage src={avatarUrl || undefined} alt="" />
        <AvatarFallback>{initials(label)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        {children ?? <span className="text-foreground truncate">{label}</span>}
        {secondary && (
          <span className="text-tertiary-foreground text-meta truncate">
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
    <section
      data-state={open ? "open" : "closed"}
      className="group/day mt-0.5 first:mt-0"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(grid, listGroupHeaderClassName)}
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
      <Collapse open={open}>{children}</Collapse>
    </section>
  )
}
