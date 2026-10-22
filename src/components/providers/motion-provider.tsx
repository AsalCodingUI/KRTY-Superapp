"use client"

import { LazyMotion, MotionConfig } from "motion/react"

const loadFeatures = () =>
  import("./motion-features").then((mod) => mod.default)

/**
 * Motion components follow the OS "reduce motion" setting app-wide.
 * Animation features (animate/exit/gestures) load lazily; components use the
 * slim `m.*` elements, which render statically until the features arrive.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
