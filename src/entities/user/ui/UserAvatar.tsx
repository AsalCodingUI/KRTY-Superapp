import { cx } from "@/shared/lib/utils"
import { tv } from "@/shared/lib/utils/tv"
import Image from "next/image"
import React from "react"
import type { VariantProps } from "tailwind-variants"

// ============================================================================
// Avatar Variants
// ============================================================================

const avatarVariants = tv({
  base: "ring-card dark:ring-card relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium ring-2",
  variants: {
    size: {
      xs: "h-6 w-6 text-xs font-medium",
      sm: "h-8 w-8 text-xs font-medium",
      md: "h-10 w-10 text-sm font-medium",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg",
    },
    color: {
      // Using chart colors for visual consistency with data viz
      chart1: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
      chart2: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      chart3: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      chart4: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
      chart5: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
      // Semantic colors
      primary: "bg-primary/10 text-primary",
      muted: "bg-muted text-muted-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    color: "chart1",
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

interface UserAvatarProps
  extends
    React.ComponentPropsWithoutRef<"img">,
    VariantProps<typeof avatarVariants> {
  src?: string
  initials?: string
  alt?: string
  color?: keyof typeof avatarVariants.variants.color
}

const UserAvatar = React.forwardRef<HTMLImageElement, UserAvatarProps>(
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

UserAvatar.displayName = "UserAvatar"

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
    "bg-muted",
    "ring-card ring-2",
    "text-muted-foreground",
  ],
  variants: {
    size: {
      xs: "h-6 w-6 text-xs",
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg",
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
  AvatarGroup,
  avatarGroupVariants,
  AvatarOverflow,
  avatarOverflowVariants,
  avatarVariants,
  UserAvatar,
  type AvatarGroupProps,
  type AvatarOverflowProps,
  type UserAvatarProps,
}
