// Tremor Raw Input [v1.0.0]

import { tv } from "@/shared/lib/utils/tv"
import { RiSearchLine } from "@/shared/ui/lucide-icons"
import * as React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx, focusInput, hasErrorInput } from "@/shared/lib/utils"

const inputStyles = tv({
  base: [
    // base
    "text-body-sm relative block w-full appearance-none rounded-md border-none px-lg py-md transition outline-none shadow-input selection:bg-surface-brand-light selection:text-foreground-primary",
    // text color
    "text-foreground-primary",
    // placeholder color
    "placeholder:text-foreground-tertiary",
    // background color
    "bg-surface-neutral-primary hover:bg-surface-neutral-secondary",
    // disabled
    "disabled:text-foreground-disable disabled:placeholder:text-foreground-disable disabled:shadow-input disabled:cursor-not-allowed",
    // focus
    focusInput,
    // invalid (optional)
    // "aria-[invalid=true]:dark:ring-red-400/20 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200 aria-[invalid=true]:border-red-500 invalid:ring-2 invalid:ring-red-200 invalid:border-red-500"
    // remove search cancel button (optional)
    "[&::--webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
  ],
  variants: {
    hasError: {
      true: hasErrorInput,
    },
    // number input
    enableStepper: {
      true: "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
    },
  },
})

interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputStyles> {
  inputClassName?: string
}

/**
 * Searchbar component with icon and built-in styling.
 *
 * @example
 * ```tsx
 * <Searchbar placeholder="Search..." />
 * ```
 */
const Searchbar = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClassName,
      hasError,
      enableStepper,
      type = "search",
      ...props
    }: InputProps,
    forwardedRef,
  ) => {
    return (
      <div className={cx("relative w-full", className)}>
        <input
          ref={forwardedRef}
          type={type}
          className={cx(
            inputStyles({ hasError, enableStepper }),
            "pl-[calc(var(--padding-lg)+20px+var(--gap-md))]",
            inputClassName,
          )}
          {...props}
        />
        <div
          className={cx(
            // base
            "pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center",
            // text color
            "text-foreground-secondary",
          )}
        >
          <RiSearchLine className="size-5 shrink-0" aria-hidden="true" />
        </div>
      </div>
    )
  },
)

Searchbar.displayName = "Searchbar"

export { Searchbar }
