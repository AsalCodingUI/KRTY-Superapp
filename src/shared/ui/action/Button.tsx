import { cx } from "@/shared/lib/utils"
import { tv } from "@/shared/lib/utils/tv"
import { RiLoader2Fill } from "@/shared/ui/lucide-icons"
import { Slot } from "@radix-ui/react-slot"
import React from "react"
import type { VariantProps } from "tailwind-variants"

const buttonVariants = tv({
  base: [
    "relative inline-flex cursor-pointer items-center justify-center font-medium whitespace-nowrap transition-all duration-200 ease-in-out",
    "focus-visible:outline-none",
    "disabled:pointer-events-none disabled:cursor-not-allowed",
    "data-[loading=true]:cursor-wait",
  ],
  variants: {
    variant: {
      primary: [
        "bg-surface-brand text-foreground-on-color shadow-brand",
        "hover:bg-surface-brand-hov",
        "focus-visible:shadow-outline-brand",
        "disabled:bg-surface-state-neutral-light-disable disabled:text-foreground-disable disabled:shadow-none",
      ],
      destructive: [
        "bg-surface-danger text-foreground-on-color shadow-danger",
        "hover:bg-surface-danger-hov",
        "focus-visible:shadow-outline-danger",
        "disabled:bg-surface-state-neutral-light-disable disabled:text-foreground-disable disabled:shadow-none",
      ],
      secondary: [
        "bg-surface-neutral-primary text-foreground-primary border border-neutral-primary shadow-none",
        "hover:bg-surface-state-neutral-light-hover",
        "focus-visible:border-foreground-brand-primary",
        "disabled:bg-surface-state-neutral-light-disable disabled:text-foreground-disable disabled:shadow-none disabled:border-transparent",
      ],
      tertiary: [
        "bg-transparent text-foreground-secondary shadow-none",
        "hover:bg-surface-state-neutral-light-hover",
        "focus-visible:shadow-outline-neutral",
        "disabled:bg-surface-state-neutral-light-disable disabled:text-foreground-disable",
      ],
      tertiaryInverse: [
        "bg-transparent text-foreground-on-color shadow-none",
        "hover:bg-surface-state-neutral-dark-hover",
        "focus-visible:shadow-outline-neutral",
        "disabled:bg-surface-state-neutral-dark-disable disabled:text-foreground-state-neutral-dark-disable",
      ],
      // Legacy compat alias
      ghost: [
        "bg-transparent text-foreground-secondary shadow-none",
        "hover:bg-surface-state-neutral-light-hover",
        "focus-visible:shadow-outline-neutral",
        "disabled:bg-surface-state-neutral-light-disable disabled:text-foreground-disable",
      ],
    },
    size: {
      default: "h-[28px] gap-[4px] rounded-[8px] px-[8px] py-[4px] text-label-sm",
      sm: "h-[28px] gap-[4px] rounded-[8px] px-[8px] py-[4px] text-label-sm",
      xs: "h-[28px] gap-[4px] rounded-[8px] px-[8px] py-[4px] text-label-sm",
      icon: "flex min-h-[28px] min-w-[28px] items-center justify-center gap-0 rounded-[8px] p-[6px]",
      "icon-sm":
        "flex min-h-[28px] min-w-[28px] items-center justify-center gap-0 rounded-[8px] p-[6px]",
      "icon-xs":
        "flex min-h-[28px] min-w-[28px] items-center justify-center gap-0 rounded-[8px] p-[6px]",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
})

/**
 * Button component with strict Amerta Design System implementation.
 * Source: Figma Node 2048:24262
 */
interface ButtonProps
  extends
    React.ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

function getLoadingClass(variant: NonNullable<ButtonProps["variant"]>) {
  switch (variant) {
    case "primary":
    case "destructive":
      return "data-[loading=true]:bg-surface-neutral-secondary data-[loading=true]:text-foreground-primary data-[loading=true]:shadow-none data-[loading=true]:hover:bg-surface-neutral-secondary data-[loading=true]:disabled:bg-surface-neutral-secondary data-[loading=true]:disabled:text-foreground-primary"
    case "secondary":
      return "data-[loading=true]:text-foreground-primary data-[loading=true]:hover:bg-surface-neutral-primary data-[loading=true]:disabled:bg-surface-neutral-primary data-[loading=true]:disabled:text-foreground-primary data-[loading=true]:disabled:shadow-neutral"
    case "tertiaryInverse":
      return "data-[loading=true]:bg-transparent data-[loading=true]:text-foreground-on-color data-[loading=true]:hover:bg-transparent data-[loading=true]:disabled:bg-transparent data-[loading=true]:disabled:text-foreground-on-color"
    case "tertiary":
    case "ghost":
    default:
      return "data-[loading=true]:bg-transparent data-[loading=true]:text-foreground-primary data-[loading=true]:hover:bg-transparent data-[loading=true]:disabled:bg-transparent data-[loading=true]:disabled:text-foreground-primary"
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild,
      isLoading = false,
      loadingText,
      className,
      disabled,
      variant,
      size,
      children,
      leadingIcon,
      trailingIcon,
      ...props
    }: ButtonProps,
    forwardedRef,
  ) => {
    const Component = asChild ? Slot : "button"

    const resolvedVariant = variant ?? "primary"
    const isIconOnlySize =
      size === "icon" || size === "icon-sm" || size === "icon-xs"
    const iconSizeClass = "size-[14px]"
    const loadingClass = isLoading ? getLoadingClass(resolvedVariant) : ""

    const shouldShowLoadingText =
      !isIconOnlySize && (loadingText !== undefined || Boolean(children))
    const resolvedLoadingText =
      loadingText !== undefined ? loadingText : "Loading..."

    const resolvedChildren =
      asChild &&
      React.isValidElement(children) &&
      children.type === React.Fragment
        ? React.createElement("span", null, children)
        : children

    if (asChild) {
      return (
        <Component
          ref={forwardedRef as any}
          className={cx(
            buttonVariants({ variant: resolvedVariant, size }),
            loadingClass,
            className,
          )}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          data-loading={isLoading}
          {...props}
        >
          {resolvedChildren}
        </Component>
      )
    }

    return (
      <Component
        ref={forwardedRef as any}
        className={cx(
          buttonVariants({ variant: resolvedVariant, size }),
          loadingClass,
          className,
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        data-loading={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <RiLoader2Fill
              className={cx(iconSizeClass, "shrink-0 animate-spin")}
              aria-hidden="true"
            />
            {shouldShowLoadingText && (
              <span className="inline-flex items-center px-xs">
                {resolvedLoadingText}
              </span>
            )}
          </>
        ) : (
          <>
            {leadingIcon && (
              <span className="flex shrink-0 items-center justify-center">
                {React.isValidElement(leadingIcon) &&
                leadingIcon.type !== React.Fragment
                  ? React.cloneElement(leadingIcon as React.ReactElement, {
                      className: cx(
                        iconSizeClass,
                        (leadingIcon as any).props?.className,
                      ),
                    })
                  : leadingIcon}
              </span>
            )}

            {children && (
              <span className="inline-flex items-center px-xs">{children}</span>
            )}

            {trailingIcon && (
              <span className="flex shrink-0 items-center justify-center">
                {React.isValidElement(trailingIcon) &&
                trailingIcon.type !== React.Fragment
                  ? React.cloneElement(trailingIcon as React.ReactElement, {
                      className: cx(
                        iconSizeClass,
                        (trailingIcon as any).props?.className,
                      ),
                    })
                  : trailingIcon}
              </span>
            )}
          </>
        )}
      </Component>
    )
  },
)

Button.displayName = "Button"
export { Button, buttonVariants, type ButtonProps }
