"use client"

import * as SliderPrimitives from "@radix-ui/react-slider"
import * as React from "react"

import { cx } from "@/shared/lib/utils"

/**
 * Slider component for range selection.
 * Built on Radix UI Slider primitive.
 *
 * @example
 * ```tsx
 * <Slider defaultValue={[50]} max={100} step={1} />
 * ```
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitives.Root
    ref={ref}
    className={cx(
      "relative flex w-full touch-none items-center select-none",
      className,
    )}
    {...props}
  >
    {/* TRACK: Dibuat h-3 (lebih tipis dari thumb) agar sambungan tertutup rapi */}
    <SliderPrimitives.Track className="bg-surface-neutral-tertiary relative h-1 w-full grow overflow-hidden rounded-full">
      <SliderPrimitives.Range className="bg-surface-brand absolute h-full" />
    </SliderPrimitives.Track>

    {/* THUMB: Ukuran h-5 (lebih besar dari track), bentuk Pill (w-7) */}
    <SliderPrimitives.Thumb
      className={cx(
        "block h-5 w-7 cursor-grab rounded-full active:cursor-grabbing",
        "bg-surface border-border-tertiary border-[0.5px]",
        "shadow-[0px_0.5px_1px_0px_rgba(0,0,0,0.08),0px_1px_2px_0px_rgba(0,0,0,0.06)]",
        "hover:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)]",
        "focus-visible:ring-surface-brand focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:bg-surface-neutral-secondary disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
      )}
    />
  </SliderPrimitives.Root>
))
Slider.displayName = SliderPrimitives.Root.displayName

export { Slider }
