import { cx } from "@/shared/lib/utils"
import { tv } from "@/shared/lib/utils/tv"
import Image from "next/image"
import React from "react"
import type { VariantProps } from "tailwind-variants"

// ============================================================================
// Avatar Variants
// ============================================================================

const avatarVariants = tv({
  base: "ring-background dark:ring-surface relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium ring-2",
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
      chart1: "bg-blue-3 text-blue-11",
      chart2: "bg-amber-3 text-amber-11",
      chart3: "bg-green-3 text-green-11",
      chart4: "bg-purple-3 text-purple-11",
      chart5: "bg-pink-3 text-pink-11",
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
    "ring-background dark:ring-surface ring-2",
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
