"use client"

import { cn } from "@/lib/utils"
import { RiCloseLine } from "@/shared/ui/lucide-icons"
import * as React from "react"

export type BannerTone = "warning" | "info"

const TONES: Record<BannerTone, string> = {
  warning: "bg-warning/15 text-warning",
  info: "bg-primary/15 text-primary",
}

/**
 * One full-width line at the very top of the app. Used for "view as" now and
 * for team announcements later; every banner can be closed.
 */
export function AppBanner({
  tone = "info",
  children,
  action,
  onClose,
}: {
  tone?: BannerTone
  children: React.ReactNode
  action?: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex min-h-9 w-full items-center gap-3 px-4 text-sm",
        TONES[tone],
      )}
    >
      <div className="min-w-0 flex-1 truncate">{children}</div>
      {action}
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="flex size-6 shrink-0 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100"
      >
        <RiCloseLine className="size-4" />
      </button>
    </div>
  )
}

/**
 * Banner stack pinned above the sidebar and page. Publishes its height as
 * --app-banner-height so the fixed sidebar starts below it.
 */
export function AppBannerStack({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement
    const update = () =>
      root.style.setProperty("--app-banner-height", `${el.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      observer.disconnect()
      root.style.removeProperty("--app-banner-height")
    }
  }, [])

  return (
    <div
      ref={ref}
      className="sticky top-0 z-50 flex w-full flex-col empty:hidden"
    >
      {children}
    </div>
  )
}
