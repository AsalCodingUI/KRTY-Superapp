"use client"

import { Button } from "@/components/ui/button"
import { Collapse } from "@/components/ui/collapse"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Check, ChevronDown } from "@/components/icons"
import { cn } from "@/lib/utils"
import { RiMoreFill } from "@/shared/ui/lucide-icons"
import * as React from "react"
import { useState } from "react"

/**
 * Small list pieces shared by the project tabs (library, documents,
 * reports, invoices, the portal). Kept apart from ProjectLibrary and
 * FilePreview so a tab that only needs a ⋯ menu doesn't load the library,
 * its note editor and the Markdown renderer.
 */

/** Yellow folder (VEED style): back tab + front body. */
export function FolderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" className={className} aria-hidden="true">
      <path
        d="M3 4.5A2.5 2.5 0 0 1 5.5 2h9.2a2.5 2.5 0 0 1 1.9.9l2 2.3H34.5A2.5 2.5 0 0 1 37 7.7V12H3z"
        fill="#F5B83D"
      />
      <rect x="3" y="8" width="34" height="22" rx="3" fill="#FCD15A" />
      <rect x="3" y="8" width="34" height="2" rx="1" fill="#FFE08A" />
    </svg>
  )
}

/** A collapsible section title ("▾ Folder"), like the reference. */
export function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <section className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-foreground flex w-fit items-center gap-1.5 text-sm"
      >
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 transition-transform duration-200 ease-out",
            !open && "-rotate-90",
          )}
        />
        {title}
      </button>
      <Collapse open={open}>{children}</Collapse>
    </section>
  )
}

/** Dark translucent chip on a thumbnail (type, duration, status). */
export function Chip({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "absolute rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] leading-4 font-medium text-white tabular-nums backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  )
}

/** A row's actions in one quiet ⋯ menu (doesn't trigger the row click). */
export type RowMenuItem = {
  label: string
  onSelect: () => void
  destructive?: boolean
  /** Shows a tick (e.g. the current status). */
  checked?: boolean
  /** Draws a divider above this item. */
  separatorBefore?: boolean
}

export function RowMenu({
  label,
  items,
  alwaysVisible = false,
}: {
  label: string
  items: RowMenuItem[]
  /** Show the ⋯ button without hovering a row (e.g. in a header). */
  alwaysVisible?: boolean
}) {
  return (
    <span className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              className={cn(
                "text-muted-foreground",
                !alwaysVisible &&
                  "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100",
              )}
            />
          }
        >
          <RiMoreFill />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-40">
          {items.map((item) => (
            <React.Fragment key={item.label}>
              {item.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem
                variant={item.destructive ? "destructive" : "default"}
                onClick={item.onSelect}
              >
                <span className="flex-1">{item.label}</span>
                {item.checked && <Check className="size-4" />}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  )
}
