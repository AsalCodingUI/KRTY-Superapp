"use client"

import { AnimatePresence, m } from "motion/react"
import * as React from "react"

/**
 * A figure that rolls when it changes (quarter switch, new data): the old
 * value slides up and fades, the new one comes up from below. Nothing moves
 * on first render. Keyed by the value, so equal values don't re-animate.
 */
export function RollingValue({
  value,
  children,
}: {
  /** What identifies the figure; defaults to `children` when it is text. */
  value?: string | number | null
  children: React.ReactNode
}) {
  const key =
    value !== undefined
      ? String(value)
      : typeof children === "string" || typeof children === "number"
        ? String(children)
        : "node"

  return (
    <span className="relative inline-flex">
      <AnimatePresence initial={false} mode="popLayout">
        <m.span
          key={key}
          className="inline-block"
          initial={{ y: "45%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-45%", opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          {children}
        </m.span>
      </AnimatePresence>
    </span>
  )
}
