// Tremor Raw Input [v1.0.3]

import { tv } from "@/shared/lib/utils/tv"
import { RiEyeFill, RiEyeOffFill, RiSearchLine } from "@/shared/ui/lucide-icons"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx, focusInput, focusRing, hasErrorInput } from "@/shared/lib/utils"

const inputStyles = tv({
  base: [
    // base
    "text-body-sm relative block w-full appearance-none rounded-md border-none transition outline-none shadow-input selection:bg-surface-brand-light selection:text-foreground-primary",
    // text color
    "text-foreground-primary",
    // placeholder color
    "placeholder:text-foreground-tertiary",
    // background color
    "bg-surface-neutral-primary hover:bg-surface-neutral-secondary ",
    // disabled
    "disabled:cursor-not-allowed disabled:text-foreground-disable disabled:placeholder:text-foreground-disable disabled:shadow-input",
    // file
    [
      "file:-my-2 file:-ml-2.5 file:cursor-pointer file:rounded-l-[6px] file:rounded-r-none file:border-0 file:px-3 file:py-2 file:outline-none focus:outline-none disabled:pointer-events-none file:disabled:pointer-events-none",
      "file:bg-surface-neutral-secondary file:text-foreground-secondary file:hover:bg-surface-neutral-tertiary file:border-solid",
      "file:[margin-inline-end:0.75rem] file:[border-inline-end-width:1px]",
      "file:disabled:bg-surface-neutral-secondary file:disabled:text-foreground-disable",
    ],
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
      false:
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
    },
    inputSize: {
      sm: "h-8 px-lg py-md",
      default: "h-8 px-lg py-md",
      lg: "h-10 px-xl py-lg text-body-md",
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
}

/**
 * Input component with support for search, password, and error states.
 *
 * @param hasError - Shows error styling when true
 * @param type - Supports special handling for "search" and "password" types
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter text..." />
 * <Input type="password" />
 * <Input type="search" />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      inputClassName,
      hasError,
      enableStepper = true,
      inputSize,
      type,
      ...props
    }: InputProps,
    forwardedRef,
  ) => {
    const [typeState, setTypeState] = React.useState(type)

    const isPassword = type === "password"
    const isSearch = type === "search"

    return (
      <div className={cx("relative w-full", className)}>
        <input
          ref={forwardedRef}
          type={isPassword ? typeState : type}
          className={cx(
            inputStyles({ hasError, enableStepper, inputSize }),
            {
              "pl-[calc(var(--padding-lg)+20px+var(--gap-md))]": isSearch,
              "pr-[calc(var(--padding-lg)+20px+var(--gap-md))]": isPassword,
            },
            inputClassName,
          )}
          {...props}
        />
        {isSearch && (
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
        )}
        {isPassword && !props.disabled && (
          <div
            className={cx(
              "absolute right-2 bottom-0 flex h-full items-center justify-center",
            )}
          >
            <button
              aria-label={
                typeState === "password" ? "Show password" : "Hide password"
              }
              className={cx(
                // base
                "h-fit w-fit rounded-sm transition-all outline-none",
                // text
                "text-foreground-tertiary",
                // hover
                "hover:text-foreground-secondary",
                focusRing,
              )}
              type="button"
              onClick={() => {
                setTypeState(typeState === "password" ? "text" : "password")
              }}
            >
              <span className="sr-only">
                {typeState === "password" ? "Show password" : "Hide password"}
              </span>
              {typeState === "password" ? (
                <RiEyeFill aria-hidden="true" className="size-5 shrink-0" />
              ) : (
                <RiEyeOffFill aria-hidden="true" className="size-5 shrink-0" />
              )}
            </button>
          </div>
        )}
      </div>
    )
  },
)

Input.displayName = "Input"

export { Input, inputStyles, type InputProps }
