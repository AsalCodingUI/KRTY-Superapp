// Tremor Raw Input [v1.0.0]

import { tv } from "@/shared/lib/utils/tv"
import { RiSearchLine } from "@/shared/ui/lucide-icons"
import * as React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx, focusInput, hasErrorInput } from "@/shared/lib/utils"

const inputSizeStyles = {
  sm: "h-[24px] py-[2px] text-body-sm",
  default: "h-[28px] py-[4px] text-body-sm",
} as const

type InputSize = keyof typeof inputSizeStyles

const inputStyles = tv({
  base: [
    // base
    "relative block w-full appearance-none rounded-md border-none transition-shadow outline-none shadow-input hover:shadow-input selection:bg-surface-brand-light selection:text-foreground-primary",
    // text color
    "text-foreground-primary",
    // placeholder color
    "placeholder:text-foreground-tertiary",
    // background color
    "bg-surface-neutral-primary hover:bg-surface-state-neutral-light-hover",
    // disabled
    "disabled:bg-surface-neutral-primary disabled:text-foreground-disable disabled:placeholder:text-foreground-disable disabled:shadow-input disabled:cursor-not-allowed",
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
    inputSize: {
      sm: inputSizeStyles.sm,
      default: inputSizeStyles.default,
    },
    // number input
    enableStepper: {
      true: "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
    },
  },
  defaultVariants: {
    inputSize: "default",
  },
})

interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputStyles> {
  inputClassName?: string
  inputSize?: InputSize
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
      inputSize = "default",
      type = "search",
      ...props
    }: InputProps,
    forwardedRef,
  ) => {
    const inputPadding =
      inputSize === "sm" ? "var(--padding-md)" : "var(--padding-lg)"

    return (
      <div className={cx("group/searchbar relative w-full", className)}>
        <input
          ref={forwardedRef}
          type={type}
          style={{ "--input-padding": inputPadding } as React.CSSProperties}
          className={cx(
            inputStyles({ hasError, enableStepper, inputSize }),
            "pl-[calc(var(--input-padding)+16px+var(--gap-sm))] pr-[var(--input-padding)]",
            inputClassName,
          )}
          {...props}
        />
        <div
          className={cx(
            // base
            "pointer-events-none absolute bottom-0 left-2 flex h-full items-center justify-center",
            // text color
            props.disabled
              ? "text-foreground-disable"
              : hasError
                ? "text-foreground-danger"
                : "text-foreground-secondary group-focus-within/searchbar:text-foreground-primary",
          )}
        >
          <RiSearchLine className="size-4 shrink-0" aria-hidden="true" />
        </div>
      </div>
    )
  },
)

Searchbar.displayName = "Searchbar"

export { Searchbar }
