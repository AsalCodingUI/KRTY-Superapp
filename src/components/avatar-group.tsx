import * as React from "react"

import {
  AvatarGroup as AvatarGroupPrimitive,
  AvatarGroupCount,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type AvatarSize = "xxxs" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl"

/** Legacy avatar size scale (px + text size), reusable for shadcn `Avatar` via className. */
const avatarSizeClasses: Record<AvatarSize, string> = {
  xxxs: "size-3.5 text-xs leading-4 font-medium",
  xxs: "size-4 text-xs leading-4 font-medium",
  xs: "size-5 text-xs leading-4 font-medium",
  sm: "size-7 text-xs font-medium",
  md: "size-8 text-sm font-medium",
  lg: "size-12 text-xl font-semibold",
  xl: "size-16 text-2xl font-semibold",
}

// ============================================================================
// Avatar Group
// ============================================================================

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <AvatarGroupPrimitive
        ref={ref}
        className={cn(
          "*:data-[slot=avatar]:ring-sidebar flex items-center -space-x-1 *:data-[slot=avatar]:ring-2",
          className,
        )}
        {...props}
      >
        {children}
      </AvatarGroupPrimitive>
    )
  },
)

AvatarGroup.displayName = "AvatarGroup"

// ============================================================================
// Avatar Overflow (for showing "+N more")
// ============================================================================

interface AvatarOverflowProps extends React.HTMLAttributes<HTMLDivElement> {
  count: number
  size?: AvatarSize
}

const AvatarOverflow = React.forwardRef<HTMLDivElement, AvatarOverflowProps>(
  ({ className, size = "sm", count, ...props }, ref) => {
    return (
      <AvatarGroupCount
        ref={ref}
        className={cn(
          "text-muted-foreground font-medium",
          avatarSizeClasses[size],
          className,
        )}
        {...props}
      >
        +{count}
      </AvatarGroupCount>
    )
  },
)

AvatarOverflow.displayName = "AvatarOverflow"

export {
  AvatarGroup,
  AvatarOverflow,
  avatarSizeClasses,
  type AvatarGroupProps,
  type AvatarOverflowProps,
  type AvatarSize,
}
