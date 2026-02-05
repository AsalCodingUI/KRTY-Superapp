// Tremor Raw Switch [v0.0.0]

"use client"

import { tv } from "@/shared/lib/utils/tv"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { motion } from "framer-motion"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx, focusRing } from "@/shared/lib/utils"

const switchVariants = tv({
  slots: {
    root: [
      // base
      "group inline-flex shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors outline-none",
      "overflow-hidden",
      "justify-start data-[state=checked]:justify-end",
      // unchecked background (default + hover)
      "bg-[linear-gradient(90deg,rgba(0,0,0,0.01)_0%,rgba(0,0,0,0.01)_100%),linear-gradient(90deg,var(--surface-neutral-secondary)_0%,var(--surface-neutral-secondary)_100%)]",
      "hover:bg-[linear-gradient(90deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.03)_100%),linear-gradient(90deg,var(--surface-neutral-secondary)_0%,var(--surface-neutral-secondary)_100%)]",
      // checked background
      "data-[state=checked]:bg-surface-success",
      "data-[state=checked]:[background-image:none]",
      "data-[state=checked]:hover:bg-surface-success-hov",
      // disabled
      "data-[disabled]:bg-surface-state-neutral-light-disable",
      "data-[disabled]:bg-none",
      "data-[disabled]:[background-image:none]",
      "data-[disabled]:cursor-not-allowed",
      // focus
      focusRing,
    ],
    thumb: [
      // base
      "pointer-events-none relative inline-block appearance-none rounded-full transition-all duration-150 ease-in-out",
      // background color
      "bg-foreground-on-color",
      "shadow-[0px_1px_3px_0px_rgba(0,0,0,0.04),0px_0px_2px_0px_rgba(0,0,0,0.18)]",
      // disabled
      "group-data-[disabled]:shadow-none",
      "group-data-[disabled]:group-data-[state=unchecked]:bg-foreground-disable",
    ],
  },
  variants: {
    size: {
      default: {
        root: "h-5 w-8",
        thumb: "h-4 w-[18px]",
      },
      small: {
        root: "h-4 w-7",
        thumb: "h-3 w-3",
      },
    },
  },
  defaultVariants: {
    size: "default",
  },
})

interface SwitchProps
  extends
  Omit<
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    "asChild"
  >,
  VariantProps<typeof switchVariants> { }

/**
 * Switch component for toggling between two states.
 * Built on Radix UI Switch primitive.
 *
 * @example
 * ```tsx
 * <Switch id="airplane-mode" />
 * <Label htmlFor="airplane-mode">Airplane Mode</Label>
 * ```
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, size, ...props }: SwitchProps, forwardedRef) => {
  const { root, thumb } = switchVariants({ size })
  return (
    <SwitchPrimitives.Root
      ref={forwardedRef}
      className={cx(root(), className)}
      {...props}
    >
      <SwitchPrimitives.Thumb asChild>
        <motion.span
          className={cx(thumb())}
          layout="position"
          transition={{ type: "spring", stiffness: 100, damping: 100, mass: 1 }}
        />
      </SwitchPrimitives.Thumb>
    </SwitchPrimitives.Root>
  )
})

Switch.displayName = "Switch"

export { Switch }
