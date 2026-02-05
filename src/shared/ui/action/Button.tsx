import { cx } from "@/shared/lib/utils"
import { tv } from "@/shared/lib/utils/tv"
import { Slot } from "@radix-ui/react-slot"
import { RiLoader2Fill } from "@/shared/ui/lucide-icons"
import React from "react"
import type { VariantProps } from "tailwind-variants"

const buttonVariants = tv({
  base: [
    // Layout - Strict Gap 4px (gap-sm)
    "gap-sm relative inline-flex cursor-pointer items-center justify-center font-medium whitespace-nowrap transition-all duration-200 ease-in-out",
    // Focus (variant-specific shadow tokens)
    "focus-visible:outline-none",
    // Disabled
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:shadow-none",
    // Loading
    "data-[loading=true]:cursor-wait",
  ],
  variants: {
    variant: {
      primary: [
        "bg-surface-brand text-foreground-on-color shadow-brand",
        "hover:bg-surface-brand-hover",
        "focus-visible:shadow-outline-brand",
        "disabled:bg-surface-neutral-secondary disabled:text-foreground-disable",
      ],
      destructive: [
        "bg-surface-danger text-foreground-on-color shadow-danger",
        "hover:bg-surface-danger-hover",
        "focus-visible:shadow-outline-danger",
        "disabled:bg-surface-neutral-secondary disabled:text-foreground-disable",
      ],
      secondary: [
        "bg-surface-neutral-primary text-foreground-primary shadow-neutral",
        "hover:bg-surface-neutral-secondary",
        "focus-visible:shadow-outline-neutral",
        "disabled:bg-surface-neutral-secondary disabled:text-foreground-disable",
      ],
      tertiary: [
        "text-foreground-secondary bg-transparent shadow-none",
        "hover:bg-surface-neutral-secondary",
        "focus-visible:shadow-outline-neutral",
        "disabled:text-foreground-disable",
      ],
      tertiaryInverse: [
        "bg-transparent text-white shadow-none",
        "hover:bg-white/10",
        "focus-visible:shadow-outline-neutral",
        "disabled:text-foreground-state-neutral-dark-disable",
      ],
      // Legacy "ghost" mapped to Tertiary for backward compat if needed, otherwise removed.
      ghost: [
        "text-foreground-secondary bg-transparent shadow-none",
        "hover:bg-surface-neutral-secondary",
        "focus-visible:shadow-outline-neutral",
        "disabled:text-foreground-disable",
      ],
    },
    size: {
      default: [
        // Medium: 32px height, 8px px, 6px py, 10px radius
        "h-[32px] rounded-[10px] px-[8px] py-[6px]",
        "text-label-sm", // 13px
      ],
      sm: [
        // Small: 28px height, 4px px, 4px py, 8px radius
        "h-[28px] rounded-[8px] px-[4px] py-[4px]",
        "text-label-sm", // 13px
      ],
      xs: [
        // XSmall: 20px height, 4px px, 2px py, 6px radius
        "h-[20px] rounded-[6px] px-[4px] py-[2px]",
        "text-label-xs", // 12px
      ],
      // Icon sizes
      icon: "flex h-[32px] w-[32px] items-center justify-center rounded-[10px] p-0", // Medium
      "icon-sm":
        "flex h-[28px] w-[28px] items-center justify-center rounded-[8px] p-0", // Small
      "icon-xs":
        "flex h-[20px] w-[20px] items-center justify-center rounded-[6px] p-0", // XSmall
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

import { motion } from "framer-motion"

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
    // If asChild is true, we use Slot. Otherwise default to motion.button.
    // Note: Framer Motion props only work if using motion.button.
    // If asChild is used, animation props might need to be passed differently or avoided on the Slot.
    const Component = asChild ? Slot : motion.button

    const isIconOnlySize =
      size === "icon" || size === "icon-sm" || size === "icon-xs"
    const iconSizeClass =
      variant === "tertiaryInverse" && size === "sm"
        ? "size-[16px]"
        : "size-[14px]"
    const shouldShowLoadingText =
      !isIconOnlySize && (loadingText !== undefined || Boolean(children))
    const resolvedLoadingText =
      loadingText !== undefined ? loadingText : "Loading..."

    return (
      <Component
        ref={forwardedRef as any}
        className={cx(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        data-loading={isLoading}
        {...(!asChild ? { whileTap: { scale: 0.98 } } : {})}
        {...props}
      >
        {isLoading ? (
          <>
            <RiLoader2Fill
              className={cx(iconSizeClass, "shrink-0 animate-spin")}
              aria-hidden="true"
            />
            {/* If there is loading text, show it. Otherwise, if there were children (label), show them? 
                Figma usually implies loading state prevents action but might keep label or just show spinner.
                Common pattern: Show spinner + text, or just spinner.
                Implementation: Replaces Leading Icon with Spinner if text present, or just content if no text?
                Let's stick to simple: Spinner + Text if loadingText provided, else just Spinner replacing content?
                Existing code replaced content. Let's keep logic but enforce sizes.
            */}
            {shouldShowLoadingText && (
              <span className="px-xs">{resolvedLoadingText}</span>
            )}
          </>
        ) : (
          <>
            {leadingIcon && (
              <span className="flex shrink-0 items-center justify-center">
                {React.isValidElement(leadingIcon)
                  ? React.cloneElement(leadingIcon as React.ReactElement, {
                      className: cx(
                        iconSizeClass,
                        (leadingIcon as any).props?.className,
                      ),
                    })
                  : leadingIcon}
              </span>
            )}

            {/* Label Wrapper - Padding 2px (padding-xs) implicitly or explicitly? 
                Raw layout data: gap=4px. Padding is on container. 
                Text itself handles its own box. 
                Existing code had span px-[2px].
                Let's simplify: Just render children. Gap handles spacing.
            */}
            {children && (
              <span className="inline-flex items-center px-xs">{children}</span>
            )}

            {trailingIcon && (
              <span className="flex shrink-0 items-center justify-center">
                {React.isValidElement(trailingIcon)
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
