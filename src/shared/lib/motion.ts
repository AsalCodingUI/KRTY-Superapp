import type { Transition, Variants } from "motion/react"

/**
 * The app's motion constants for `m.*` (docs/ui/motion.md). Classes use
 * `ease-out` + `duration-150 / 200 / 300`; these are the same values in JS.
 */

/** The one curve: `--ease-out` in globals.css. */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const

/** The same curve as a CSS string, for APIs that take one (dnd-kit). */
export const EASE_OUT_CSS = "cubic-bezier(0.23, 1, 0.32, 1)"

/** The three steps, in seconds: hover / press, default, larger arrivals. */
export const DURATION = { fast: 0.15, base: 0.2, slow: 0.3 } as const

/** The default `m.*` transition: 200ms on the one ease. */
export const TRANSITION = {
  duration: DURATION.base,
  ease: EASE_OUT,
} as const satisfies Transition

/**
 * The minimal screens' arrival (sign-in, portal PIN): the column reveals
 * its parts in turn, the icon settles out of a blur on a spring, text
 * rises a few pixels. Both end with `filter: none` (a leftover filter
 * traps fixed children).
 */
export const ARRIVAL: Record<"stagger" | "icon" | "rise", Variants> = {
  stagger: {
    hidden: {},
    show: { transition: { delayChildren: 0.12, staggerChildren: 0.09 } },
  },
  icon: {
    hidden: { opacity: 0, scale: 0.72, rotate: -8, filter: "blur(10px)" },
    show: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      filter: "blur(0px)",
      transitionEnd: { filter: "none" },
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        opacity: { duration: 0.35, ease: EASE_OUT },
        filter: { duration: 0.45, ease: EASE_OUT },
      },
    },
  },
  rise: {
    hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transitionEnd: { filter: "none" },
      transition: { duration: 0.6, ease: EASE_OUT },
    },
  },
}
