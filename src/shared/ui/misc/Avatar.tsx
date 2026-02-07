import { cx } from "@/shared/lib/utils"
import { tv } from "@/shared/lib/utils/tv"
import Image from "next/image"
import React from "react"
import type { VariantProps } from "tailwind-variants"

// ============================================================================
// Avatar Variants
// ============================================================================

const avatarVariants = tv({
  base: "relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium",
  variants: {
    size: {
      xxxs: "h-[14px] w-[14px] text-label-xs leading-[16px]",
      xxs: "h-[16px] w-[16px] text-label-xs leading-[16px]",
      xs: "h-[20px] w-[20px] text-label-xs leading-[16px]",
      sm: "h-[28px] w-[28px] text-label-xs",
      md: "h-[32px] w-[32px] text-label-md",
      lg: "h-[48px] w-[48px] text-heading-lg",
      xl: "h-[64px] w-[64px] text-display-xxs",
    },
    color: {
      // Figma subtle variants
      brand: "bg-surface-brand-light text-foreground-brand-dark",
      success: "bg-surface-success-light text-foreground-success-dark",
      warning: "bg-surface-warning-light text-foreground-warning-on-color",
      danger: "bg-surface-danger-light text-foreground-danger-dark",
      neutral: "bg-surface-neutral-secondary text-foreground-secondary",
      // Compat aliases
      primary: "bg-surface-brand-light text-foreground-brand-dark",
      muted: "bg-surface-neutral-secondary text-foreground-secondary",
      // Chart aliases (mapped to subtle palette)
      chart1: "bg-surface-brand-light text-foreground-brand-dark",
      chart2: "bg-surface-success-light text-foreground-success-dark",
      chart3: "bg-surface-warning-light text-foreground-warning-on-color",
      chart4: "bg-surface-danger-light text-foreground-danger-dark",
      chart5: "bg-surface-neutral-secondary text-foreground-secondary",
    },
  },
  defaultVariants: {
    size: "md",
    color: "brand",
  },
})

// Simple hash function to generate consistent color from string
function getColorFromString(
  str: string,
): keyof typeof avatarVariants.variants.color {
  const colors: Array<keyof typeof avatarVariants.variants.color> = [
    "chart1",
    "chart2",
    "chart3",
    "chart4",
    "chart5",
  ]

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

interface AvatarProps
  extends
  React.ComponentPropsWithoutRef<"img">,
  VariantProps<typeof avatarVariants> {
  src?: string
  initials?: string
  alt?: string
  color?: keyof typeof avatarVariants.variants.color
}

/**
 * Avatar component for displaying user images or initials.
 *
 * @example
 * ```tsx
 * <Avatar src="https://..." alt="John Doe" />
 * <Avatar initials="JD" color="brand" />
 * ```
 */
const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ src, initials, alt, className, size, color, ...props }, _ref) => {
    const [hasError, setHasError] = React.useState(false)

    // Auto-generate color from initials if not provided
    const avatarColor =
      color || (initials ? getColorFromString(initials) : "chart1")

    if (src && !hasError) {
      return (
        <div className={cx(avatarVariants({ size }), className, "relative")}>
          <Image
            src={src}
            alt={alt || "Avatar"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            onError={() => setHasError(true)}
          />
        </div>
      )
    }

    return (
      <div
        className={cx(avatarVariants({ size, color: avatarColor }), className)}
        {...props}
      >
        {initials || (alt ? alt.charAt(0).toUpperCase() : "?")}
      </div>
    )
  },
)

Avatar.displayName = "Avatar"

// ============================================================================
// Avatar Group
// ============================================================================

const avatarGroupVariants = tv({
  base: "flex items-center -space-x-2",
})

interface AvatarGroupProps
  extends
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof avatarGroupVariants> {
  children: React.ReactNode
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx(avatarGroupVariants(), className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

AvatarGroup.displayName = "AvatarGroup"

// ============================================================================
// Avatar Overflow (for showing "+N more")
// ============================================================================

const avatarOverflowVariants = tv({
  base: [
    "flex items-center justify-center rounded-full font-medium",
    "bg-surface-neutral-secondary text-foreground-secondary",
  ],
  variants: {
    size: {
      xxxs: "h-[14px] w-[14px] text-label-xs leading-[16px]",
      xxs: "h-[16px] w-[16px] text-label-xs leading-[16px]",
      xs: "h-[20px] w-[20px] text-label-xs leading-[16px]",
      sm: "h-[28px] w-[28px] text-label-xs",
      md: "h-[32px] w-[32px] text-label-md",
      lg: "h-[48px] w-[48px] text-heading-lg",
      xl: "h-[64px] w-[64px] text-display-xxs",
    },
  },
  defaultVariants: {
    size: "sm",
  },
})

interface AvatarOverflowProps
  extends
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof avatarOverflowVariants> {
  count: number
}

const AvatarOverflow = React.forwardRef<HTMLDivElement, AvatarOverflowProps>(
  ({ className, size, count, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx(avatarOverflowVariants({ size }), className)}
        {...props}
      >
        +{count}
      </div>
    )
  },
)

AvatarOverflow.displayName = "AvatarOverflow"

// ============================================================================
// Exports
// ============================================================================

export {
  Avatar,
  AvatarGroup,
  avatarGroupVariants,
  AvatarOverflow,
  avatarOverflowVariants,
  avatarVariants,
  type AvatarGroupProps,
  type AvatarOverflowProps,
  type AvatarProps
}

