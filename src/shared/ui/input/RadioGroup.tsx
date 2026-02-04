"use client"

// Tremor RadioGroup [v1.0.0]

import * as RadioGroupPrimitives from "@radix-ui/react-radio-group"
import React from "react"

import { cx, focusRing } from "@/shared/lib/utils"

/**
 * RadioGroup component for single selection.
 * Built on Radix UI RadioGroup primitive.
 *
 * @example
 * ```tsx
 * <RadioGroup defaultValue="option1">
 *   <RadioGroupItem value="option1" />
 *   <Label>Option 1</Label>
 * </RadioGroup>
 * ```
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitives.Root>
>(({ className, ...props }, forwardedRef) => {
  return (
    <RadioGroupPrimitives.Root
      ref={forwardedRef}
      className={cx("grid gap-2", className)}
      tremor-id="tremor-raw"
      {...props}
    />
  )
})

RadioGroup.displayName = "RadioGroup"

const RadioGroupIndicator = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitives.Indicator>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitives.Indicator>
>(({ className, ...props }, forwardedRef) => {
  return (
    <RadioGroupPrimitives.Indicator
      ref={forwardedRef}
      className={cx("flex items-center justify-center", className)}
      {...props}
    >
      <div
        className={cx(
          // base
          "size-1.5 shrink-0 rounded-full",
          // indicator
          "bg-foreground-on-color",
          // disabled
          "group-data-disabled:bg-foreground-disable",
        )}
      />
    </RadioGroupPrimitives.Indicator>
  )
})

RadioGroupIndicator.displayName = "RadioGroupIndicator"

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitives.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitives.Item>
>(({ className, ...props }, forwardedRef) => {
  return (
    <RadioGroupPrimitives.Item
      ref={forwardedRef}
      className={cx(
        "group relative flex size-4 appearance-none items-center justify-center outline-hidden",
        className,
      )}
      {...props}
    >
      <div
        className={cx(
          // base
          "shadow-xs-border flex size-4 shrink-0 items-center justify-center rounded-full border",
          // border color
          "border-border-default",
          // background color
          "bg-surface",
          // checked
          "group-data-[state=checked]:bg-surface-brand group-data-[state=checked]:border-0 group-data-[state=checked]:border-transparent",
          // disabled
          "group-data-disabled:border",
          "group-data-disabled:border-border-disable group-data-disabled:bg-surface-neutral-tertiary group-data-disabled:text-foreground-disable",

          // focus
          focusRing,
        )}
      >
        <RadioGroupIndicator />
      </div>
    </RadioGroupPrimitives.Item>
  )
})

RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
