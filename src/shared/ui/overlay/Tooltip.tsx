// Tremor Raw Tooltip [v0.0.1]

"use client"

import * as TooltipPrimitives from "@radix-ui/react-tooltip"
import React from "react"

import { cx } from "@/shared/lib/utils"

interface TooltipProps
  extends Omit<TooltipPrimitives.TooltipContentProps, "content" | "onClick">,
    Pick<
      TooltipPrimitives.TooltipProps,
      "open" | "defaultOpen" | "onOpenChange" | "delayDuration"
    > {
  content: React.ReactNode
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  side?: "bottom" | "left" | "top" | "right"
  showArrow?: boolean
  triggerAsChild?: boolean
}

/**
 * Tooltip component for displaying helper text.
 * Built on Radix UI Tooltip primitive.
 *
 * @param content - The content to display in the tooltip
 * @param side - The side to display the tooltip (top, right, bottom, left)
 * @param showArrow - Whether to show the arrow
 *
 * @example
 * ```tsx
 * <Tooltip content="Helper text">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * ```
 */
const Tooltip = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitives.Content>,
  TooltipProps
>(
  (
    {
      children,
      className,
      content,
      delayDuration,
      defaultOpen,
      open,
      onClick,
      onOpenChange,
      showArrow = true,
      side,
      sideOffset = 10,
      triggerAsChild = false,
      ...props
    }: TooltipProps,
    forwardedRef,
  ) => {
    return (
      <TooltipPrimitives.Provider delayDuration={150}>
        <TooltipPrimitives.Root
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
          delayDuration={delayDuration}
        >
          <TooltipPrimitives.Trigger onClick={onClick} asChild={triggerAsChild}>
            {children}
          </TooltipPrimitives.Trigger>
          <TooltipPrimitives.Portal>
            <TooltipPrimitives.Content
              ref={forwardedRef}
              side={side}
              sideOffset={sideOffset}
              align="center"
              className={cx(
                // base
                "max-w-60 rounded-md px-2.5 py-1.5 text-sm leading-5 shadow-md select-none",
                // text color
                "text-foreground-primary",
                // background color
                "bg-surface",
                // transition
                "will-change-[transform,opacity]",
                "data-[side=bottom]:animate-slideDownAndFade data-[side=left]:animate-slideLeftAndFade data-[side=right]:animate-slideRightAndFade data-[side=top]:animate-slideUpAndFade data-[state=closed]:animate-hide",
                className,
              )}
              {...props}
            >
              {content}
              {showArrow ? (
                <TooltipPrimitives.Arrow
                  className="fill-surface border-none" // Fixed fill color to match bg
                  width={12}
                  height={7}
                  aria-hidden="true"
                />
              ) : null}
            </TooltipPrimitives.Content>
          </TooltipPrimitives.Portal>
        </TooltipPrimitives.Root>
      </TooltipPrimitives.Provider>
    )
  },
)

Tooltip.displayName = "Tooltip"

export { Tooltip, type TooltipProps }
