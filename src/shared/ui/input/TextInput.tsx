"use client"

import {
  RiCloseCircleFill,
  RiEyeFill,
  RiEyeOffFill,
  RiErrorWarningLine,
  RiCalendar2Fill,
  RiLoader2Fill,
  RiSearchLine,
  RiTimeLine,
} from "@/shared/ui/lucide-icons"
import React from "react"

import { cx } from "@/shared/lib/utils"
import { Label } from "./Label"

const inputSizeStyles = {
  sm: "h-[28px] py-[4px] text-body-sm",
  default: "h-[28px] py-[4px] text-body-sm",
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
  label?: string
  required?: boolean
  showOptional?: boolean
  optionalText?: string
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
      label,
      required,
      showOptional,
      optionalText = "(Optional)",
      inputSize = "default",
      isLoading,
      onClear,
      id,
      ...props
    },
    forwardedRef,
  ) => {
    const [typeState, setTypeState] = React.useState(type)
    const isPassword = type === "password"
    const isSearch = type === "search"
    const isDate = type === "date"
    const isTime = type === "time"
    const isDisabled = props.disabled

    // Resolve icons
    const LeftIcon = leadingIcon || icon
    const autoRightIcon = isDate ? RiCalendar2Fill : isTime ? RiTimeLine : null
    const RightIcon = trailingIcon || autoRightIcon

    const hasLeftIcon = Boolean(LeftIcon) || isSearch
    const hasPrefix = Boolean(prefix)
    const hasLeftContent = hasLeftIcon || hasPrefix
    // Password toggle or Clear button or Loading spinner takes precedence as "action" icon
    const hasRightAction = isPassword || (onClear && props.value) || isLoading
    const hasTrailingIcon = Boolean(RightIcon)
    const hasRightContent = hasRightAction || hasTrailingIcon || suffix

    const inputPadding =
      inputSize === "sm" ? "var(--padding-md)" : "var(--padding-lg)"

    const leftPaddingClass = hasLeftIcon && hasPrefix
      ? "pl-[calc(var(--input-padding)+16px+var(--gap-sm)+20px+var(--gap-sm))]"
      : hasLeftIcon
        ? "pl-[calc(var(--input-padding)+16px+var(--gap-sm))]"
        : hasPrefix
          ? "pl-[calc(var(--input-padding)+20px+var(--gap-sm))]"
          : "pl-[var(--input-padding)]"

    const rightPaddingClass = hasRightContent
      ? suffix && (hasTrailingIcon || hasRightAction)
        ? "pr-[calc(var(--input-padding)+28px+var(--gap-sm)+16px+var(--gap-sm))]"
        : suffix
          ? "pr-[calc(var(--input-padding)+28px+var(--gap-sm))]"
          : "pr-[calc(var(--input-padding)+16px+var(--gap-sm))]"
      : "pr-[var(--input-padding)]"

    const renderIcon = (
      Icon: React.ElementType | React.ReactElement | undefined,
      className: string,
    ) => {
      if (!Icon) return null
      if (React.isValidElement(Icon)) {
        const element = Icon as React.ReactElement<{ className?: string }>
        return React.cloneElement(element, {
          className: cx(className, element.props?.className),
        })
      }
      const Component = Icon as React.ElementType
      return <Component className={className} />
    }

    return (
      <div className="relative w-full">
        {label && (
          <div className="mb-1 flex items-center gap-sm">
            <Label htmlFor={id} disabled={isDisabled}>
              {label}
            </Label>
            {required && (
              <span className="text-label-sm text-foreground-brand-dark">*</span>
            )}
            {!required && showOptional && (
              <span
                className={cx(
                  "text-body-sm text-foreground-secondary",
                  isDisabled && "text-foreground-disable",
                )}
              >
                {optionalText}
              </span>
            )}
          </div>
        )}

        <div className="group/text-input relative flex w-full items-center">
          {/* Left Content */}
          <div
            className={cx(
              "pointer-events-none absolute left-2 flex items-center justify-center gap-sm",
              isDisabled
                ? "text-foreground-disable"
                : "text-foreground-secondary group-focus-within/text-input:text-foreground-primary",
            )}
          >
            {isSearch && !LeftIcon && (
              <RiSearchLine className="size-4 shrink-0" aria-hidden="true" />
            )}
            {renderIcon(
              LeftIcon,
              cx("size-4 shrink-0", error && "text-foreground-danger"),
            )}
            {prefix && (
              <span
                className={cx(
                  "text-body-sm min-w-[16px] max-w-[20px] text-center",
                  isDisabled
                    ? "text-foreground-disable"
                    : error
                      ? "text-foreground-danger"
                      : "text-foreground-secondary group-focus-within/text-input:text-foreground-primary",
                )}
              >
                {prefix}
              </span>
            )}
          </div>

          <input
            ref={forwardedRef}
            id={id}
            type={isPassword ? typeState : type}
            style={{ "--input-padding": inputPadding } as React.CSSProperties}
            className={cx(
              // Base styles
              "bg-surface-neutral-primary text-foreground-primary w-full rounded-md border-none shadow-input hover:shadow-input transition-shadow",
              "hover:bg-surface-state-neutral-light-hover",
              "placeholder:text-foreground-tertiary",
              "focus:shadow-input-focus focus:outline-none",
              "disabled:bg-surface-neutral-primary disabled:text-foreground-disable disabled:placeholder:text-foreground-disable disabled:cursor-not-allowed disabled:shadow-input",
              // Size styles
              inputSizeStyles[inputSize],
              // Error styles
              error && "shadow-input-error hover:shadow-input-error focus:shadow-input-error",
              // Padding calculations based on content
              leftPaddingClass,
              rightPaddingClass,
              (isDate || isTime) &&
                "appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer",
              className,
            )}
            {...props}
          />

          {/* Right Content */}
          <div className="absolute right-2 flex items-center justify-center gap-sm">
            {isLoading ? (
              <RiLoader2Fill className="text-foreground-secondary size-5 animate-spin" />
            ) : (
              <>
                {onClear && props.value && !props.disabled && (
                  <button
                    type="button"
                    onClick={onClear}
                    className={cx(
                      "hover:text-foreground-primary focus:outline-none",
                      error
                        ? "text-foreground-danger"
                        : "text-foreground-secondary group-focus-within/text-input:text-foreground-primary",
                    )}
                  >
                    <RiCloseCircleFill className="size-4" />
                  </button>
                )}

                {isPassword && !isDisabled && (
                  <button
                    type="button"
                    onClick={() =>
                      setTypeState(typeState === "password" ? "text" : "password")
                    }
                    className="text-foreground-secondary group-focus-within/text-input:text-foreground-primary hover:text-foreground-primary focus:outline-none"
                  >
                    {typeState === "password" ? (
                      <RiEyeFill className="size-4" />
                    ) : (
                      <RiEyeOffFill className="size-4" />
                    )}
                  </button>
                )}

                {!hasRightAction && RightIcon && (
                  <div
                    className={cx(
                      "pointer-events-none flex items-center",
                      isDisabled
                        ? "text-foreground-disable"
                        : "text-foreground-secondary group-focus-within/text-input:text-foreground-primary",
                    )}
                  >
                    {renderIcon(RightIcon, "size-4")}
                  </div>
                )}

                {suffix && !hasRightAction && !RightIcon && (
                  <span
                    className={cx(
                      "text-body-sm pointer-events-none min-w-[16px] max-w-[28px] text-center",
                      isDisabled
                        ? "text-foreground-disable"
                        : error
                          ? "text-foreground-danger"
                          : "text-foreground-secondary group-focus-within/text-input:text-foreground-primary",
                    )}
                  >
                    {suffix}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Helper Text or Error Message */}
        {error && errorMessage ? (
          <p className="text-foreground-danger text-body-xs mt-1 flex items-center gap-1">
            <RiErrorWarningLine className="size-4 shrink-0" />
            {errorMessage}
          </p>
        ) : helperText ? (
          <p className="text-foreground-secondary text-body-xs mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  },
)

TextInput.displayName = "TextInput"

export { TextInput, type TextInputProps }
