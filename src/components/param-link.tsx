"use client"

import { replaceUrl } from "@/shared/lib/url-params"
import type { AnchorHTMLAttributes } from "react"

/**
 * A link that only changes this page's query (?entry=, ?policy=): a plain
 * click pushes the URL without a navigation, so the window over the list
 * opens at once. ⌘/Ctrl/middle click still opens a new tab.
 */
export function ParamLink({
  href,
  onClick,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a
      {...rest}
      href={href}
      onClick={(e) => {
        onClick?.(e)
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        )
          return
        e.preventDefault()
        replaceUrl(href, true)
      }}
    />
  )
}
