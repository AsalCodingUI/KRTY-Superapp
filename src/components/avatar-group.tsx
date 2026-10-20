import * as React from "react"

import {
  AvatarGroup as AvatarGroupPrimitive,
  AvatarGroupCount,
} from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type AvatarSize = "xxxs" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl"

/** Legacy avatar size scale (px + text size), reusable for shadcn `Avatar` via className. */
const avatarSizeClasses: Record<AvatarSize, string> = {
  xxxs: "size-3.5 text-label-xs leading-4",
  xxs: "size-4 text-label-xs leading-4",
  xs: "size-5 text-label-xs leading-4",
  sm: "size-7 text-label-xs",
  md: "size-8 text-label-md",
  lg: "size-12 text-heading-lg",
  xl: "size-16 text-display-xxs",
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
        className={cn("flex items-center -space-x-1 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-card", className)}
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
          "font-medium text-muted-foreground",
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
