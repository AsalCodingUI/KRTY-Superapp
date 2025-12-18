import { cx } from "@/lib/utils"
import Image from "next/image"
import React from "react"
import { tv, type VariantProps } from "tailwind-variants"

// ============================================================================
// Avatar Variants
// ============================================================================

const avatarVariants = tv({
    base: "relative inline-flex items-center justify-center rounded-full font-medium ring-2 ring-surface dark:ring-surface overflow-hidden",
    variants: {
        size: {
            xs: "h-6 w-6 text-[0.625rem]",
            sm: "h-8 w-8 text-xs",
            md: "h-10 w-10 text-sm",
            lg: "h-12 w-12 text-base",
            xl: "h-16 w-16 text-lg",
        },
        color: {
            // Using chart colors for visual consistency with data viz
            chart1: "bg-chart-1/15 text-chart-1",
            chart2: "bg-chart-2/15 text-chart-2",
            chart3: "bg-chart-3/15 text-chart-3",
            chart4: "bg-chart-4/15 text-chart-4",
            chart5: "bg-chart-5/15 text-chart-5",
            // Semantic colors
            primary: "bg-primary/15 text-primary",
            muted: "bg-muted text-content-subtle",
        },
    },
    defaultVariants: {
        size: "md",
        color: "chart1",
    },
})

// Simple hash function to generate consistent color from string
function getColorFromString(str: string): keyof typeof avatarVariants.variants.color {
    const colors: Array<keyof typeof avatarVariants.variants.color> = [
        "chart1", "chart2", "chart3", "chart4", "chart5"
    ]

    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
}

interface AvatarProps
    extends React.ComponentPropsWithoutRef<"img">,
    VariantProps<typeof avatarVariants> {
    src?: string
    initials?: string
    alt?: string
    color?: keyof typeof avatarVariants.variants.color
}

const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
    ({ src, initials, alt, className, size, color, ...props }, _ref) => {
        const [hasError, setHasError] = React.useState(false)

        // Auto-generate color from initials if not provided
        const avatarColor = color || (initials ? getColorFromString(initials) : "chart1")

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
    }
)

Avatar.displayName = "Avatar"

// ============================================================================
// Avatar Group
// ============================================================================

const avatarGroupVariants = tv({
    base: "flex items-center -space-x-2",
})

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof avatarGroupVariants> {
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
    }
)

AvatarGroup.displayName = "AvatarGroup"

// ============================================================================
// Avatar Overflow (for showing "+N more")
// ============================================================================

const avatarOverflowVariants = tv({
    base: [
        "rounded-full flex items-center justify-center font-medium",
        "bg-border dark:bg-hover",
        "ring-2 ring-surface dark:ring-surface",
        "text-content-subtle dark:text-content-placeholder"
    ],
    variants: {
        size: {
            xs: "h-6 w-6 text-[0.625rem]",
            sm: "h-8 w-8 text-xs",
            md: "h-10 w-10 text-sm",
            lg: "h-12 w-12 text-base",
            xl: "h-16 w-16 text-lg",
        }
    },
    defaultVariants: {
        size: "sm"
    }
})

interface AvatarOverflowProps
    extends React.HTMLAttributes<HTMLDivElement>,
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
    }
)

AvatarOverflow.displayName = "AvatarOverflow"

// ============================================================================
// Exports
// ============================================================================

export {
    Avatar,
    AvatarGroup, avatarGroupVariants, AvatarOverflow, avatarOverflowVariants, avatarVariants, type AvatarGroupProps,
    type AvatarOverflowProps, type AvatarProps
}

