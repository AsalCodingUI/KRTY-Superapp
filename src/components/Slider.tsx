"use client"

import * as SliderPrimitives from "@radix-ui/react-slider"
import * as React from "react"

import { cx } from "@/lib/utils"

const Slider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SliderPrimitives.Root>
>(({ className, ...props }, ref) => (
    <SliderPrimitives.Root
        ref={ref}
        className={cx(
            "relative flex w-full touch-none select-none items-center",
            className,
        )}
        {...props}
    >
        {/* TRACK: Dibuat h-3 (lebih tipis dari thumb) agar sambungan tertutup rapi */}
        <SliderPrimitives.Track className="relative h-3 w-full grow overflow-hidden rounded-full bg-border dark:bg-hover">
            <SliderPrimitives.Range className="absolute h-full bg-primary dark:bg-primary" />
        </SliderPrimitives.Track>

        {/* THUMB: Ukuran h-5 (lebih besar dari track), bentuk Pill (w-7) */}
        <SliderPrimitives.Thumb
            className={cx(
                "block h-5 w-7 rounded-full cursor-grab active:cursor-grabbing",
                "bg-surface border-2 border-primary shadow-sm",
                "dark:bg-surface dark:border-primary",
                "ring-offset-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:ring-offset-surface",
                "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed"
            )}
        />
    </SliderPrimitives.Root>
))
Slider.displayName = SliderPrimitives.Root.displayName

export { Slider }
