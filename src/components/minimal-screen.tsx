import { BrandBackdrop } from "@/components/brand-backdrop"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { cn } from "@/lib/utils"
import type { ComponentProps, ReactNode } from "react"

/**
 * The minimal screens (a brief's start, sign in, the portal's PIN, connect
 * the Mac app, 404 / error): one frosted card in the middle of the brand
 * backdrop, the page controls in a pill outside it, top right.
 */

/** The card's frosted surface (with <GlassLayer /> inside it): a touch
 *  see-through, so the backdrop shows. */
export const glassSurfaceClass =
  "relative isolate overflow-hidden shadow-(--elev-2)"

/**
 * The frost itself, on its own layer behind the card's content: with the
 * blur on the card, scrolling its content (or the backdrop redrawing) made
 * the browser redo the blur and the card blinked for a frame, mostly in
 * Safari and the Mac app. Its own GPU layer keeps it steady.
 */
export function GlassLayer() {
  return (
    <span
      aria-hidden
      className="bg-background/80 pointer-events-none absolute inset-0 -z-10 [transform:translateZ(0)] rounded-[inherit] backdrop-blur-2xl backdrop-saturate-150 [backface-visibility:hidden]"
    />
  )
}

/** A field or quiet button on that surface, see-through in both themes. */
export const glassControlClass =
  "bg-white/35 hover:bg-white/55 dark:bg-field dark:hover:bg-field-hover"

/** Translate, theme…: outside the card, top right. */
export function ScreenControls({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background/80 fixed top-3 right-3 z-20 flex items-center gap-0.5 rounded-full p-1 shadow-(--elev-1) backdrop-blur sm:top-4 sm:right-4">
      {children}
    </div>
  )
}

/** The darker field under the backdrop (like the app's shell). */
export const screenBackgroundClass =
  "bg-sidebar text-foreground dark:bg-[color-mix(in_oklab,var(--background)_55%,black)]"

export function MinimalScreen({
  children,
  controls,
  className,
}: {
  children: ReactNode
  /** Defaults to the theme toggle. */
  controls?: ReactNode
  className?: string
}) {
  return (
    <main
      className={cn(
        screenBackgroundClass,
        "relative flex min-h-dvh flex-col items-center justify-center p-4 pt-16 sm:p-6",
        className,
      )}
    >
      <BrandBackdrop />
      <ScreenControls>
        {controls ?? <ThemeToggleButton className="size-9 rounded-full" />}
      </ScreenControls>
      {children}
    </main>
  )
}

/** The card: its content centered, in a narrow column. */
export function MinimalCard({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        glassSurfaceClass,
        "rounded-dialog z-10 w-full max-w-lg px-6 py-12 sm:px-10 sm:py-14",
        className,
      )}
    >
      <GlassLayer />
      <div className="mx-auto flex max-w-sm flex-col items-center gap-6 text-center">
        {children}
      </div>
    </div>
  )
}

/** The logo at the top of the card, as on a brief. */
export const screenLogoClass = "size-12 rounded-tile"

/** The card's heading and its line under it. */
export const screenTitleClass =
  "text-heading text-2xl font-medium tracking-tight text-balance"
export const screenTextClass =
  "text-muted-foreground text-title leading-relaxed text-balance"
