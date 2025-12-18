import { cx, focusRing } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { RiLoader2Fill } from "@remixicon/react"
import React from "react"
import { tv, type VariantProps } from "tailwind-variants"

const buttonVariants = tv({
  base: [
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-md border text-center font-medium shadow-sm transition-all duration-100 ease-in-out",
    "disabled:pointer-events-none disabled:shadow-none",
    focusRing,
  ],
  variants: {
    variant: {
      primary: [
        "border-transparent",
        "text-primary-foreground",
        "bg-primary hover:bg-primary-hover",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ],
      secondary: [
        "border-border-default",
        "text-content",
        "bg-surface hover:bg-muted",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ],
      light: [
        "shadow-none",
        "border-transparent",
        "text-content",
        "bg-muted hover:bg-hover",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ],
      ghost: [
        "shadow-none",
        "border-transparent",
        "text-content",
        "bg-transparent hover:bg-muted",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ],
      destructive: [
        "text-white",
        "border-transparent",
        "bg-danger hover:opacity-90", // Pake Semantic Variable
        "disabled:opacity-50",
      ],
    },
    size: {
      default: "px-3 py-2 text-sm",
      sm: "px-2.5 py-1.5 text-sm",
      xs: "px-2 py-1 text-xs",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
})

interface ButtonProps
  extends React.ComponentPropsWithoutRef<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
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
      ...props
    }: ButtonProps,
    forwardedRef,
  ) => {
    const Component = asChild ? Slot : "button"
    return (
      <Component
        ref={forwardedRef}
        className={cx(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="pointer-events-none flex shrink-0 items-center justify-center gap-1.5">
            <RiLoader2Fill
              className="size-4 shrink-0 animate-spin"
              aria-hidden="true"
            />
            <span className="sr-only">
              {loadingText ? loadingText : "Loading"}
            </span>
            {loadingText ? loadingText : children}
          </span>
        ) : (
          children
        )}
      </Component>
    )
  },
)

Button.displayName = "Button"
export { Button, buttonVariants, type ButtonProps }
