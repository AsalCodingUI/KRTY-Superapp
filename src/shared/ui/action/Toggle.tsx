// Tremor Toggle [v1.0.0]
"use client"

import * as TogglePrimitive from "@radix-ui/react-toggle"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import React from "react"

import { cx, focusRing } from "@/shared/lib/utils"

const toggleStyles = [
  // base
  "group inline-flex h-[38px] min-w-9 items-center justify-center gap-2 rounded-md border px-2 text-sm font-medium shadow-xs-border transition-all duration-100 ease-in-out",
  "border-border-default",
  // text color
  "text-foreground-primary",
  // background color
  "bg-surface",
  //hover color
  "hover:bg-surface-neutral-secondary",
  // disabled
  "disabled:pointer-events-none disabled:text-foreground-disable",
  "data-[state=on]:bg-surface-neutral-secondary data-[state=on]:text-foreground-primary",
  focusRing,
]

/**
 * Toggle button component with on/off states.
 * Built on Radix UI Toggle primitive.
 *
 * @example
 * ```tsx
 * // Single toggle
 * <Toggle aria-label="Toggle bold">
 *   <RiBold className="size-4" />
 * </Toggle>
 *
 * // Toggle group (single selection)
 * <ToggleGroup type="single" defaultValue="left">
 *   <ToggleGroupItem value="left" aria-label="Align left">
 *     <RiAlignLeft className="size-4" />
 *   </ToggleGroupItem>
 *   <ToggleGroupItem value="center" aria-label="Align center">
 *     <RiAlignCenter className="size-4" />
 *   </ToggleGroupItem>
 *   <ToggleGroupItem value="right" aria-label="Align right">
 *     <RiAlignRight className="size-4" />
 *   </ToggleGroupItem>
 * </ToggleGroup>
 * ```
 */
const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>
>(({ className, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cx(toggleStyles, className)}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle }

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cx(
      "flex flex-nowrap items-center justify-center gap-1",
      className,
    )}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cx(toggleStyles, className)}
    {...props}
  >
    {children}
  </ToggleGroupPrimitive.Item>
))

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
