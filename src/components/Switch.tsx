// Tremor Raw Switch [v0.0.0]

import * as SwitchPrimitives from "@radix-ui/react-switch"
import React from "react"
import { tv, VariantProps } from "tailwind-variants"

import { cx, focusRing } from "@/lib/utils"

const switchVariants = tv({
  slots: {
    root: [
      // base
      "group relative isolate inline-flex shrink-0 cursor-pointer items-center rounded-full p-0.5 shadow-inner outline-none ring-1 ring-inset transition-all",
      "bg-border dark:bg-surface",
      // ring color
      "ring-border/50 dark:ring-border",
      // checked
      "data-[state=checked]:bg-primary data-[state=checked]:dark:bg-primary",
      // disabled
      "ring-border/50 dark:ring-border",
      // focus
      focusRing,
      // disabled - checked
      "data-[disabled]:bg-muted",
      "data-[disabled]:data-[state=checked]:ring-border",
      "data-[disabled]:dark:bg-hover",
      "data-[disabled]:data-[state=checked]:dark:ring-border",
      // disabled button - unchecked
      "data-[disabled]:data-[state=unchecked]:ring-border",
      // disabled button indicator - unchecked
      "data-[disabled]:data-[state=unchecked]:dark:bg-hover",
      "data-[disabled]:data-[state=unchecked]:dark:ring-border-subtle",
      "data-[disabled]:cursor-not-allowed",
    ],
    thumb: [
      // base
      "pointer-events-none relative inline-block transform appearance-none rounded-full border-none shadow-lg outline-none transition-all duration-150 ease-in-out focus:border-none focus:outline-none focus:outline-transparent",
      // background color
      "bg-surface dark:bg-muted",
      // disabled
      "group-data-[disabled]:shadow-none",
      "group-data-[disabled]:bg-muted group-data-[disabled]:dark:bg-muted0",
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
