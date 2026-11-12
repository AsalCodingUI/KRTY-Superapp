import { cn } from "@/lib/utils"
import type * as React from "react"

/**
 * A list | detail page (Evernote-style; Catatan saya, Tugas saya): from lg
 * the two panes fill the page sheet edge to edge, the sheet's own padding
 * taken back (gutter, top, bottom; the sheet keeps no scrollbar room for
 * it, globals.css), a
 * full-height hairline between them; each scrolls on its own, the page
 * doesn't. Below lg they stack and the page scrolls as usual.
 *
 * <SplitPane>
 *   <SplitPaneList>
 *     <SplitPaneTitle title="Catatan saya" count={2} actions={…} />
 *     …search / filters (px-5)…
 *     <SplitPaneScroll>{rows with splitPaneItemClassName(active)}</SplitPaneScroll>
 *   </SplitPaneList>
 *   <SplitPaneDetail>…</SplitPaneDetail>
 * </SplitPane>
 */
export function SplitPane({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="split-pane"
      className={cn(
        "flex max-lg:flex-col max-lg:gap-6 lg:mx-[calc(var(--page-gutter)*-1)] lg:-mt-6 lg:-mb-6 lg:h-[calc(100svh-var(--app-topbar-height)-var(--app-tabs-height,0px)-var(--app-banner-height,0px)-0.375rem)]",
        className,
      )}
      {...props}
    />
  )
}

/** The list column (320px, or `className` for another width). */
export function SplitPaneList({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="split-pane-list"
      className={cn(
        "border-border flex min-h-0 w-full shrink-0 flex-col lg:w-80 lg:border-r",
        className,
      )}
      {...props}
    />
  )
}

/**
 * The list's title row, level with the sidebar panel's "Kantor" and the
 * detail's bar: 32px, 12px from the sheet's top, the name in 14px medium
 * (like Kantor), a quiet count beside it, actions on the right.
 */
export function SplitPaneTitle({
  title,
  count,
  actions,
}: {
  title: React.ReactNode
  count?: number
  actions?: React.ReactNode
}) {
  return (
    <div className="flex h-8 items-center justify-between gap-2">
      <h1 className="text-foreground flex min-w-0 items-baseline gap-1.5 text-sm font-medium">
        <span className="truncate">{title}</span>
        {count !== undefined && (
          <span className="text-tertiary-foreground font-normal tabular-nums">
            {count}
          </span>
        )}
      </h1>
      {actions && (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </div>
  )
}

/** The list column's top block: the title row, then search / filters. */
export function SplitPaneHead({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-3 px-5 pt-3 pb-3", className)}
      {...props}
    />
  )
}

/** The list's search: on the chrome's 1px line with no fill, like + Baru
 *  beside it in the sidebar (not the 1px field edge). */
export const splitPaneSearchClassName =
  "border-chrome-border hover:border-chrome-border w-full border bg-transparent hover:bg-transparent"

/** The list's rows, scrolling under the head (ends fade, scroll-fade).
 *  px-2 + a row's px-3: the rows' content on the head's 20px edge. */
export function SplitPaneScroll({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "scroll-fade flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pt-1 pb-3",
        className,
      )}
      {...props}
    />
  )
}

/**
 * One row of the list: the open one filled like the sidebar's active row
 * (no outline), a light wash on hover, the focus ring drawn inside (the
 * scroller never clips it).
 */
export function splitPaneItemClassName(active: boolean) {
  return cn(
    "focus-visible:ring-focus-ring flex w-full min-w-0 rounded-lg text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset",
    active ? "bg-sidebar-active" : "hover:bg-chrome-hover",
  )
}

/** The detail pane, filling the rest (a bordered card when stacked). */
export function SplitPaneDetail({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="split-pane-detail"
      className={cn(
        "max-lg:rounded-card max-lg:border-border flex min-h-96 min-w-0 flex-1 flex-col text-sm max-lg:border",
        className,
      )}
      {...props}
    />
  )
}
