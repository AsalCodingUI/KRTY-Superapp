import { cx } from "@/shared/lib/utils"
import { tv } from "@/shared/lib/utils/tv"
import { Slot } from "@radix-ui/react-slot"
import { RiLoader2Fill } from "@remixicon/react"
import React from "react"
import type { VariantProps } from "tailwind-variants"

const buttonVariants = tv({
  base: [
    // Layout - Strict Gap 4px (gap-sm)
    "gap-sm relative inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 ease-in-out",
    // Focus - using shadow-outline-brand
    "focus-visible:outline-none focus-visible:shadow-outline-brand",
    // Disabled
    "disabled:pointer-events-none disabled:shadow-none disabled:cursor-not-allowed",
    // Loading
    "data-[loading=true]:cursor-wait",
  ],
  variants: {
    variant: {
      primary: [
        "bg-surface-brand text-foreground-on-color shadow-brand",
        "border-transparent border", // explicit border width 1px usually implied but here effectively 0/transparent unless needed
        "hover:bg-surface-brand-hov",
        "disabled:bg-surface-neutral-secondary disabled:text-foreground-disable",
      ],
      destructive: [
        "bg-surface-danger text-foreground-on-color shadow-danger",
        "border-transparent border",
        "hover:bg-surface-danger-hov",
        "disabled:bg-surface-neutral-secondary disabled:text-foreground-disable",
      ],
      secondary: [
        "bg-surface-neutral-primary text-foreground-primary shadow-neutral",
        "border-transparent border",
        "hover:bg-surface-neutral-secondary",
        "disabled:bg-surface-neutral-secondary disabled:text-foreground-disable",
      ],
      tertiary: [
        "bg-transparent text-foreground-secondary shadow-none",
        "hover:bg-surface-neutral-secondary",
        "disabled:text-foreground-disable",
      ],
      tertiaryInverse: [
        "bg-transparent text-white shadow-none",
        "hover:bg-white/10",
        "disabled:text-white/50",
      ],
      // Legacy "ghost" mapped to Tertiary for backward compat if needed, otherwise removed.
      ghost: [
        "bg-transparent text-foreground-secondary shadow-none",
        "hover:bg-surface-neutral-secondary",
        "disabled:text-foreground-disable",
      ],
    },
    size: {
      default: [
        // Medium: 32px height, 8px px, 6px py, 10px radius
        "h-[32px] px-[8px] py-[6px] rounded-[10px]",
        "text-label-sm", // 13px
      ],
      sm: [
        // Small: 28px height, 4px px, 4px py, 8px radius
        "h-[28px] px-[4px] py-[4px] rounded-[8px]",
        "text-label-sm", // 13px
      ],
      xs: [
        // XSmall: 20px height, 4px px, 2px py, 6px radius
        "h-[20px] px-[4px] py-[2px] rounded-[6px]",
        "text-label-xs", // 12px
      ],
      // Icon sizes
      icon: "h-[32px] w-[32px] rounded-[10px] p-0 flex items-center justify-center", // Medium
      "icon-sm": "h-[28px] w-[28px] rounded-[8px] p-0 flex items-center justify-center", // Small
      "icon-xs": "h-[20px] w-[20px] rounded-[6px] p-0 flex items-center justify-center", // XSmall
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
  extends React.ComponentPropsWithoutRef<"button">,
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

    // Define strict icon size based on design spec (14px)
    const iconSizeClass = "size-[14px]"

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
              className={cx(iconSizeClass, "animate-spin shrink-0")}
              aria-hidden="true"
            />
            {/* If there is loading text, show it. Otherwise, if there were children (label), show them? 
                Figma usually implies loading state prevents action but might keep label or just show spinner.
                Common pattern: Show spinner + text, or just spinner.
                Implementation: Replaces Leading Icon with Spinner if text present, or just content if no text?
                Let's stick to simple: Spinner + Text if loadingText provided, else just Spinner replacing content?
                Existing code replaced content. Let's keep logic but enforce sizes.
            */}
            {loadingText && (
              <span className="px-[2px]">
                {loadingText}
              </span>
            )}
            {!loadingText && children && (
              // If loading but no loading text, we often still want to show the label OR just the spinner.
              // Existing implementation replaced content with "Loading" text or loadingText.
              // Let's adopt a cleaner pattern: Spinner + Children (opacity reduced?) or just Spinner?
              // Detailed plan said: "Replaces content with SpinnerGap".
              // So if no loadingText, maybe we hide children?
              // Let's stick to existing code behavior improved: Spinner + loadingText or Spinner only.
              // Wait, existing code: if loadingText, show it. Else show "Loading" (sr-only) + children?
              // Let's render children but maybe pointer-events-none.
              <span className="px-[2px]">
                {children}
              </span>
            )}
          </>
        ) : (
          <>
            {leadingIcon && (
              <span className="flex items-center justify-center shrink-0">
                {React.isValidElement(leadingIcon)
                  ? React.cloneElement(leadingIcon as React.ReactElement, { className: cx(iconSizeClass, (leadingIcon as any).props?.className) })
                  : leadingIcon
                }
              </span>
            )}

            {/* Label Wrapper - Padding 2px (padding-xs) implicitly or explicitly? 
                Raw layout data: gap=4px. Padding is on container. 
                Text itself handles its own box. 
                Existing code had span px-[2px].
                Let's simplify: Just render children. Gap handles spacing.
            */}
            {children && (
              <span className="">
                {children}
              </span>
            )}

            {trailingIcon && (
              <span className="flex items-center justify-center shrink-0">
                {React.isValidElement(trailingIcon)
                  ? React.cloneElement(trailingIcon as React.ReactElement, { className: cx(iconSizeClass, (trailingIcon as any).props?.className) })
                  : trailingIcon
                }
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
