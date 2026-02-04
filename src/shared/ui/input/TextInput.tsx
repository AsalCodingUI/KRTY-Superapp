"use client"

import {
  RiCloseCircleFill,
  RiEyeFill,
  RiEyeOffFill,
  RiLoader2Fill,
  RiSearchLine,
} from "@remixicon/react"
import React from "react"

import { cx } from "@/shared/lib/utils"

const inputSizeStyles = {
  // Figma: padding-lg (8px) horizontal, padding-md (6px) vertical for Default
  sm: "px-[8px] py-[4px] text-[12px] h-8",
  default: "px-[8px] py-[6px] text-[13px] h-9", // px-2 py-1.5
  lg: "px-[12px] py-[8px] text-[14px] h-10",
} as const

type InputSize = keyof typeof inputSizeStyles

/**
 * TextInput component with icon support, error handling, and Amerta design system styling.
 */
interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  icon?: React.ElementType | React.ReactElement // Left icon (deprecated, use leadingIcon)
  leadingIcon?: React.ElementType | React.ReactElement
  trailingIcon?: React.ElementType | React.ReactElement
  prefix?: string
  suffix?: string
  error?: boolean
  errorMessage?: string
  helperText?: string
  inputSize?: InputSize
  isLoading?: boolean
  onClear?: () => void
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      className,
      type = "text",
      icon, // legacy support
      leadingIcon,
      trailingIcon,
      prefix,
      suffix,
      error,
      errorMessage,
      helperText,
      inputSize = "default",
      isLoading,
      onClear,
      ...props
    },
    forwardedRef,
  ) => {
    const [typeState, setTypeState] = React.useState(type)
    const isPassword = type === "password"
    const isSearch = type === "search"

    // Resolve icons
    const LeftIcon = leadingIcon || icon
    const RightIcon = trailingIcon

    const hasLeftContent = LeftIcon || isSearch || prefix
    // Password toggle or Clear button or Loading spinner takes precedence as "action" icon
    const hasRightAction = isPassword || (onClear && props.value) || isLoading
    const hasRightContent = hasRightAction || RightIcon || suffix

    return (
      <div className="relative w-full">
        <div className="relative flex w-full items-center">
          {/* Left Content */}
          <div className="text-content-subtle pointer-events-none absolute left-3 flex items-center justify-center gap-2">
            {isSearch && !LeftIcon && (
              <RiSearchLine className="size-4 shrink-0" aria-hidden="true" />
            )}
            {typeof LeftIcon === "function" ? (
              <LeftIcon
                className={cx("size-4 shrink-0", error && "text-danger")}
              />
            ) : (
              LeftIcon
            )}
            {prefix && (
              <span className="text-content-subtle text-[13px] font-normal">
                {prefix}
              </span>
            )}
          </div>

          <input
            ref={forwardedRef}
            type={isPassword ? typeState : type}
            className={cx(
              // Base styles
              "bg-surface text-content flex w-full rounded-lg transition-shadow duration-200",
              "placeholder:text-content-placeholder",
              "focus:shadow-input-focus focus:outline-none",
              "disabled:bg-surface-neutral-secondary disabled:text-content-disabled disabled:cursor-not-allowed disabled:shadow-none",
              // Size styles
              inputSizeStyles[inputSize],
              // Error styles
              error &&
                "text-danger placeholder:text-danger/50 focus:shadow-input-error",
              // Padding calculations based on content
              // 8px (px) + 16px (icon) + 8px (gap) = 32px (pl-8)
              hasLeftContent ? (prefix ? "pl-8" : "pl-8") : "pl-2", // pl-2 = 8px
              hasRightContent ? (suffix ? "pr-12" : "pr-8") : "pr-2", // pr-2 = 8px
              className,
            )}
            style={{
              boxShadow: error
                ? "var(--shadow-input-error)"
                : "var(--shadow-input)",
            }}
            {...props}
          />

          {/* Right Content */}
          <div className="absolute right-3 flex items-center justify-center gap-2">
            {isLoading ? (
              <RiLoader2Fill className="text-content-subtle size-4 animate-spin" />
            ) : (
              <>
                {onClear && props.value && !props.disabled && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="text-content-placeholder hover:text-content-subtle focus:outline-none"
                  >
                    <RiCloseCircleFill className="size-4" />
                  </button>
                )}

                {isPassword && (
                  <button
                    type="button"
                    onClick={() =>
                      setTypeState(
                        typeState === "password" ? "text" : "password",
                      )
                    }
                    className="text-content-placeholder hover:text-content-subtle focus:outline-none"
                  >
                    {typeState === "password" ? (
                      <RiEyeFill className="size-4" />
                    ) : (
                      <RiEyeOffFill className="size-4" />
                    )}
                  </button>
                )}

                {!hasRightAction && RightIcon && (
                  <div className="text-content-subtle pointer-events-none flex items-center">
                    {typeof RightIcon === "function" ? (
                      <RightIcon className="size-4" />
                    ) : (
                      RightIcon
                    )}
                  </div>
                )}

                {suffix && !hasRightAction && !RightIcon && (
                  <span className="text-content-subtle pointer-events-none text-[13px] font-normal">
                    {suffix}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Helper Text or Error Message */}
        {error && errorMessage ? (
          <p className="text-danger mt-1 flex items-center gap-1 text-xs">
            {/* Can add error icon here if needed */}
            {errorMessage}
          </p>
        ) : helperText ? (
          <p className="text-content-subtle mt-1 text-xs">{helperText}</p>
        ) : null}
      </div>
    )
  },
)

TextInput.displayName = "TextInput"

export { TextInput, type TextInputProps }
