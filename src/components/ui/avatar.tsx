"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cn } from "@/lib/utils"

function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  /** xs 20 · sm 24 · md 28 (person rows) · default 32 · lg 40. */
  size?: "xs" | "sm" | "md" | "default" | "lg"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 rounded-full select-none data-[size=lg]:size-10 data-[size=md]:size-7 data-[size=sm]:size-6 data-[size=xs]:size-5",
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className,
      )}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  children,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  // Initials render as a single letter app-wide ("AF" → "A").
  const content =
    typeof children === "string" && /^[\p{L}\p{N}]/u.test(children.trim())
      ? children.trim().charAt(0).toUpperCase()
      : children
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        // Muted is translucent; layer it on the page colour so it stays solid.
        "bg-background dark:bg-surface text-muted-foreground flex size-full items-center justify-center rounded-full bg-[linear-gradient(var(--muted),var(--muted))] font-medium",
        // Initials follow the avatar's size (data-size, or a size-* class
        // on the Avatar): 20px → 9px, 24 → 10, 28/32 → 11, 36/40 → 12,
        // bigger → 14+. Call sites never pass a text size.
        "text-micro group-data-[size=xs]/avatar:text-[9px] group-data-[size=sm]/avatar:text-[10px] group-data-[size=lg]/avatar:text-xs",
        "group-[.size-5]/avatar:text-[9px] group-[.size-6]/avatar:text-[10px] group-[.size-7]/avatar:text-micro group-[.size-8]/avatar:text-micro group-[.size-9]/avatar:text-xs group-[.size-10]/avatar:text-xs group-[.size-12]/avatar:text-sm group-[.size-14]/avatar:text-base group-[.size-16]/avatar:text-lg group-[.size-20]/avatar:text-2xl",
        className,
      )}
      {...props}
    >
      {content}
    </AvatarPrimitive.Fallback>
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group avatar-stack flex -space-x-1.5 [--avatar-overlap:6px]",
        className,
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "bg-background dark:bg-surface text-muted-foreground relative flex size-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(var(--muted),var(--muted))] text-sm group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&_svg]:size-4 group-has-data-[size=lg]/avatar-group:[&_svg]:size-5 group-has-data-[size=sm]/avatar-group:[&_svg]:size-3",
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount }
