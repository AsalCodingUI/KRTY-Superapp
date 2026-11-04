"use client"

import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { RiCloseLine } from "@/shared/ui/lucide-icons"
import * as React from "react"

export type BannerTone = "warning" | "info"

// Every banner is a soft, tinted black (see banner-ink); the ring keeps it
// apart from the dark chrome.
const SOLID = "banner-ink text-white dark:ring-1 dark:ring-white/10"

const TONES: Record<BannerTone, string> = {
  warning: SOLID,
  info: SOLID,
}

/**
 * One compact line in the tinted app chrome, under the top bar. Used for
 * "view as" now and for team announcements later; every banner can be closed.
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
  const t = useT("common")
  return (
    <div
      role="status"
      className={cn(
        "flex min-h-9 w-full items-center gap-3 rounded-lg px-3 py-1 text-sm",
        TONES[tone],
      )}
    >
      <div className="min-w-0 flex-1 truncate">{children}</div>
      {action}
      <button
        type="button"
        onClick={onClose}
        aria-label={t("close")}
        className="flex size-6 shrink-0 items-center justify-center rounded-md opacity-70 transition-opacity hover:opacity-100"
      >
        <RiCloseLine className="size-4" />
      </button>
    </div>
  )
}

/**
 * Banner stack on the chrome between the tab row and the page sheet, as
 * wide as the sheet. Publishes its height as --app-banner-height (side
 * sheets and full-height pages start below it; the sidebar doesn't).
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
      // Phones: inset from the window like the sheet; from md flush with
      // the sheet's edges (the column has none of its own).
      className="flex w-full shrink-0 flex-col gap-1.5 px-2 pb-2 empty:hidden md:px-0"
    >
      {children}
    </div>
  )
}
