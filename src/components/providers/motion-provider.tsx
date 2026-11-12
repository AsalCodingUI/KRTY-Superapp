"use client"

import { webkitStill } from "@/shared/lib/motion"
import { LazyMotion, MotionConfig } from "motion/react"
import { useState } from "react"

const loadFeatures = () =>
  import("./motion-features").then((mod) => mod.default)

/**
 * Motion components follow the OS "reduce motion" setting app-wide.
 * Animation features (animate/exit/gestures) load lazily; components use the
 * slim `m.*` elements, which render statically until the features arrive.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  // WebKit: still, whatever the OS setting (webkitStill). Only a context
  // value, no markup, so server and client may differ.
  const [still] = useState(() => typeof window !== "undefined" && webkitStill())
  return (
    <LazyMotion features={loadFeatures}>
      <MotionConfig reducedMotion={still ? "always" : "user"}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
