import { SidebarInset } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type * as React from "react"

/** The sheet's corner on the web. */
// 10px squircled (reads ~8px), every corner alike.
const SHEET_RADIUS = "md:rounded-lg"

/** The page sheet's corners in the Mac app (ChatGPT's): 14px, the bottom
 *  right 10px (parallel to the window's 16pt corner, 6px in). A native
 *  size, so not a radius role. The page scroller itself is painted
 *  (globals.css, --sheet-*; the Mac shell sets the same values). */
const MAC_SHEET_RADIUS = "md:rounded-[14px] md:rounded-br-[10px]"

/**
 * The scrolling sheet itself. The scrollbar's room is always kept, on both
 * sides (scroll-pane), so a page that gets shorter doesn't shift sideways
 * and the left and right spacing match; the gutter gives back that room
 * (--sbw). Phones: the page is a sheet on the chrome, top corners rounded.
 */
export const pageSheetClassName =
  "dark:bg-surface scroll-pane overscroll-contain max-md:rounded-t-dialog [--bleed:0.75rem] [--page-gutter:max(var(--bleed),calc(1.25rem-var(--sbw,0px)))] md:z-20 md:[--page-gutter:calc(1.5rem-var(--sbw,0px))]"

/**
 * Exactly the room left in the page sheet: viewport minus the top bar, the
 * tab row above the sheet (md up, web), any banner, the sheet's top and
 * bottom padding and, from md, its bottom margin. A page this tall never
 * scrolls itself; its panes scroll inside (calendar, notes).
 */
export const pageFillHeightClassName =
  "h-[calc(100svh-var(--app-topbar-height)-var(--app-banner-height,0px)-4.5rem)] md:h-[calc(100svh-var(--app-topbar-height)-var(--app-tabs-height,0px)-var(--app-banner-height,0px)-2.625rem)]"

/** The wrapper around the page inside the sheet (each shell adds its own
 *  bottom room for its tab bar). */
export const pageSheetContentClassName =
  "gutter-x flex flex-1 flex-col gap-4 overflow-x-clip"

/**
 * The page sheet both shells float on the chrome (`(main)` layout and the
 * client portal). The shadow is its own layer so it can blend darken into
 * the chrome (deepening the tint) while the page stays as it is; no
 * stacking context on the wrapper, or the blend would have nothing to mix
 * with.
 */
export function PageSheet({
  mac = false,
  aside,
  className,
  ...props
}: React.ComponentProps<typeof SidebarInset> & {
  /** Kretya Flow for Mac: the corner follows the window's. */
  mac?: boolean
  /** A column inside the sheet, before the page (the sidebar's panel,
   *  Obvious-style): it shares the sheet's fill and corners; the page
   *  scrolls on its own beside it. */
  aside?: React.ReactNode
}) {
  const radius = mac ? MAC_SHEET_RADIUS : SHEET_RADIUS
  const page = (
    <SidebarInset
      data-paper=""
      // Never round the Mac scroller: WebKit can retain that clip after hover.
      className={cn(
        pageSheetClassName,
        mac ? "md:rounded-none" : radius,
        // Beside the panel its left corners are square (painted ones too).
        aside && "md:rounded-l-none md:[--sheet-tl:0px] md:[--sheet-bl:0px]",
        className,
      )}
      {...props}
    />
  )
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div
        aria-hidden
        data-slot="page-sheet-shadow"
        className={cn(
          "blend-shadow shadow-paper pointer-events-none absolute inset-0 z-20 hidden md:block",
          radius,
        )}
      />
      {aside ? (
        // The sheet's fill and corners on the wrapper, so the column and
        // the page read as one sheet. No overflow clip here: WebKit
        // (Kretya Flow, Safari) offsets a rounded clip around the scrolling
        // page by the wrapper's own position, cutting the page's right and
        // bottom off and dropping repaints on hover.
        <div
          className={cn(
            // 85% white (90% over the dark chrome): the panel over it lets
            // the chrome's blur through a little (ChatGPT's panel); the
            // page paints its own white.
            "md:bg-background/85 md:dark:bg-surface/85 [:root[data-dark-chrome]:not(.dark)_&]:md:bg-background/90 flex min-h-0 min-w-0 flex-1 md:z-20",
            radius,
          )}
        >
          {aside}
          {page}
        </div>
      ) : (
        page
      )}
    </div>
  )
}
