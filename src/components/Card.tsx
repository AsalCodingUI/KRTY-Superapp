// Tremor Raw Card [v0.0.1]

import { Slot } from "@radix-ui/react-slot"
import React from "react"

import { cx } from "@/lib/utils"

interface CardProps extends React.ComponentPropsWithoutRef<"div"> {
  asChild?: boolean
}

/**
 * Card component for grouping related content.
 * 
 * @example
 * ```tsx
 * <Card>
 *   <h3>Title</h3>
 *   <p>Content here</p>
 * </Card>
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, asChild, ...props }, forwardedRef) => {
    const Component = asChild ? Slot : "div"
    return (
      <Component
        ref={forwardedRef}
        className={cx(
          // base
          "relative w-full rounded-lg border p-4 text-left",
          // background color
          "bg-surface text-content",
          // border color
          "border-border",
          className,
        )}
        {...props}
      />
    )
  },
)

Card.displayName = "Card"

export { Card, type CardProps }

