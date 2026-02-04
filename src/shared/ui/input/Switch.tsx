// Tremor Raw Switch [v0.0.0]

import { tv } from "@/shared/lib/utils/tv"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx, focusRing } from "@/shared/lib/utils"

const switchVariants = tv({
  slots: {
    root: [
      // base
      "group relative isolate inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 shadow-inner ring-1 transition-all outline-none ring-inset",
      "bg-surface-neutral-tertiary",
      // ring color
      "ring-border-default",
      // checked
      "data-[state=checked]:bg-surface-brand",
      // disabled
      "ring-border-disable",
      // focus
      focusRing,
      // disabled - checked
      "data-[disabled]:bg-surface-neutral-tertiary",
      "data-[disabled]:data-[state=checked]:ring-border-disable",
      // disabled button - unchecked
      "data-[disabled]:data-[state=unchecked]:ring-border-disable",
      // disabled button indicator - unchecked
      "data-[disabled]:cursor-not-allowed",
    ],
    thumb: [
      // base
      "pointer-events-none relative inline-block transform appearance-none rounded-full border-none shadow-lg transition-all duration-150 ease-in-out outline-none focus:border-none focus:outline-transparent focus:outline-none",
      // background color
      "bg-surface",
      // disabled
      "group-data-[disabled]:shadow-none",
      "group-data-[disabled]:bg-surface-neutral-secondary",
    ],
  },
  variants: {
    size: {
      default: {
        root: "h-5 w-9",
        thumb:
          "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
      },
      small: {
        root: "h-4 w-7",
        thumb:
          "h-3 w-3 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0",
      },
    },
  },
  defaultVariants: {
    size: "default",
  },
})

interface SwitchProps
  extends Omit<
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
      <SwitchPrimitives.Thumb className={cx(thumb())} />
    </SwitchPrimitives.Root>
  )
})

Switch.displayName = "Switch"

export { Switch }
