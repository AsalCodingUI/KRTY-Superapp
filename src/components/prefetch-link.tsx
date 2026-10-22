"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type * as React from "react"

type PrefetchLinkProps = Omit<React.ComponentProps<typeof Link>, "prefetch">

/**
 * Link that skips viewport prefetching (every prefetch runs the auth
 * middleware) and prefetches on intent instead: hover, keyboard focus or
 * touch start.
 */
export function PrefetchLink({
  href,
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter()
  const prefetch = () => {
    if (typeof href === "string") router.prefetch(href)
  }

  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onMouseEnter={(event) => {
        onMouseEnter?.(event)
        prefetch()
      }}
      onFocus={(event) => {
        onFocus?.(event)
        prefetch()
      }}
      onTouchStart={(event) => {
        onTouchStart?.(event)
        prefetch()
      }}
    />
  )
}
