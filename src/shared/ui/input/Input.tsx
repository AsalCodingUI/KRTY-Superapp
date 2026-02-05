// Tremor Raw Input [v1.0.3]

import { tv } from "@/shared/lib/utils/tv"
import { RiEyeFill, RiEyeOffFill, RiSearchLine } from "@/shared/ui/lucide-icons"
import React from "react"
import type { VariantProps } from "tailwind-variants"

import { cx, focusInput, focusRing, hasErrorInput } from "@/shared/lib/utils"

const inputStyles = tv({
  base: [
    // base
    "sm:text-body-sm relative block w-full appearance-none truncate rounded-md border transition outline-none",
    // border color
    "border-border",
    // text color
    "text-content",
    // placeholder color
    "placeholder-content-placeholder",
    // background color
    "bg-surface",
    // disabled
    "disabled:cursor-not-allowed disabled:opacity-50",
    // file
    [
      "file:-my-2 file:-ml-2.5 file:cursor-pointer file:rounded-l-[5px] file:rounded-r-none file:border-0 file:px-3 file:py-2 file:outline-none focus:outline-none disabled:pointer-events-none file:disabled:pointer-events-none",
      "file:border-border file:bg-muted file:text-content-subtle file:hover:bg-hover file:disabled:border-border-subtle file:border-solid",
      "file:[margin-inline-end:0.75rem] file:[border-inline-end-width:1px]",
      "file:disabled:bg-muted file:disabled:text-content-disabled file:disabled:dark:bg-muted",
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
      sm: "text-body-sm px-2.5 py-1.5",
      default: "text-body-sm px-2.5 py-2",
      lg: "text-body-md px-3 py-2.5",
    },
  },
  defaultVariants: {
    inputSize: "sm",
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
              "pl-8": isSearch,
              "pr-10": isPassword,
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
              "text-content-placeholder dark:text-content-subtle",
            )}
          >
            <RiSearchLine
              className="size-[1.125rem] shrink-0"
              aria-hidden="true"
            />
          </div>
        )}
        {isPassword && (
          <div
            className={cx(
              "absolute right-0 bottom-0 flex h-full items-center justify-center px-3",
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
                "text-content-placeholder dark:text-content-subtle",
                // hover
                "hover:text-content-subtle hover:dark:text-content-subtle",
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
