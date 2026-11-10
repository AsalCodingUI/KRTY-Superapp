import { SidebarInset } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type * as React from "react"

/** The sheet's corner on the web. */
// Small, like Fibery's (8px squircled reads ~6px).
const SHEET_RADIUS = "md:rounded-md"

/** The page sheet's corner in the Mac app: the window's 16pt corner less
 *  the 6px inset (a native size, so not a radius role). */
const MAC_SHEET_RADIUS = "md:rounded-[10px]"

/**
 * The scrolling sheet itself. The scrollbar's room is always kept, on both
 * sides (scroll-pane), so a page that gets shorter doesn't shift sideways
 * and the left and right spacing match; the gutter gives back that room
 * (--sbw). Phones: the page is a sheet on the chrome, top corners rounded.
 */
export const pageSheetClassName =
  "dark:bg-surface scroll-pane overscroll-contain max-md:rounded-t-dialog [--bleed:0.75rem] [--list-overhang:0px] [--page-gutter:max(var(--bleed),calc(1.25rem-var(--sbw,0px)))] md:z-20 md:[--page-gutter:calc(2rem-var(--sbw,0px))] xl:[--page-gutter:calc(3rem-var(--sbw,0px))]"

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
  className,
  ...props
}: React.ComponentProps<typeof SidebarInset> & {
  /** Kretya Flow for Mac: the corner follows the window's. */
  mac?: boolean
}) {
  const radius = mac ? MAC_SHEET_RADIUS : SHEET_RADIUS
  return (
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div
        aria-hidden
        data-slot="page-sheet-shadow"
        className={cn(
          "blend-shadow shadow-raised pointer-events-none absolute inset-0 z-20 hidden md:block",
          radius,
        )}
      />
      <SidebarInset
        data-paper=""
        className={cn(pageSheetClassName, radius, className)}
        {...props}
      />
    </div>
  )
}
