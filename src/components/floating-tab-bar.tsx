"use client"

import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Menu } from "lucide-react"
import { LayoutGroup, LazyMotion, m } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ComponentType, type ReactNode } from "react"

// The app loads Motion's slim features; the tab bar's sliding bubble and
// resizing tabs need the layout ones too.
const loadLayoutFeatures = () =>
  import("@/components/providers/motion-features-max").then(
    (mod) => mod.default,
  )

/** The bubble's glide: soft, with a touch of give at the end. */
const TAB_SPRING = { type: "spring", bounce: 0.2, duration: 0.55 } as const

export type FloatingTab = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  filled: ComponentType<{ className?: string }>
  active: boolean
}

/**
 * The phone's navigation (iOS style): a floating pill of dark glass across
 * the bottom with the pages as equal icon tabs (the open one filled, on a
 * bubble that glides between them), and a round menu button beside it.
 * The page fades out underneath so nothing reads through it. Used by the
 * client portal and the app on phones.
 */
export function FloatingTabBar({
  items,
  menu,
  id,
}: {
  items: FloatingTab[]
  /** What the round menu button opens (theme, language, sign out…). */
  menu: ReactNode
  /** Keeps each bar's bubble animation to itself. */
  id: string
}) {
  const tc = useT("common")
  // The tapped tab lights up at once, not when the page has loaded.
  const current = items.find((i) => i.active)?.href
  const [pending, setPending] = useState<string | null>(null)
  // Any finished navigation (also Back, or one that was cancelled) settles
  // the tab on the page actually shown.
  const pathname = usePathname()
  const [seen, setSeen] = useState(pathname)
  if (seen !== pathname) {
    setSeen(pathname)
    setPending(null)
  }
  const activeHref = pending ?? current
  const glass =
    // Dark glass; in dark mode the modal surface, so it stands off the page.
    "pointer-events-auto bg-black/70 dark:bg-popover/80 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.35)] dark:shadow-[0_10px_30px_-8px_rgb(0_0_0/0.7)] backdrop-blur-xl backdrop-saturate-150"
  return (
    <nav className="from-background dark:from-surface pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-center gap-2 bg-gradient-to-t from-40% to-transparent px-4 pt-12 pb-[max(calc(env(safe-area-inset-bottom)+0.5rem),1.75rem)] md:hidden">
      {/* The pages fill the pill in equal tabs; the bubble glides to the
          tapped one. */}
      <LazyMotion features={loadLayoutFeatures}>
        <LayoutGroup id={id}>
          <div
            className={cn(glass, "flex flex-1 items-center rounded-full p-1.5")}
          >
            {items.map((item) => {
              const active = item.href === activeHref
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setPending(item.href)}
                  className={cn(
                    "relative flex h-11 min-w-0 flex-1 items-center justify-center rounded-full transition-colors duration-300 [-webkit-tap-highlight-color:transparent]",
                    active ? "text-white" : "text-white/60",
                  )}
                >
                  {active && (
                    <m.span
                      layoutId={`${id}-bubble`}
                      transition={TAB_SPRING}
                      className="absolute inset-0 rounded-full bg-white/15"
                    />
                  )}
                  {/* Outline and filled icon cross-fade in place. */}
                  <span className="relative size-5 shrink-0">
                    <item.icon
                      className={cn(
                        "absolute inset-0 size-5 transition-opacity duration-300",
                        active && "opacity-0",
                      )}
                    />
                    <item.filled
                      className={cn(
                        "absolute inset-0 size-5 transition-opacity duration-300",
                        !active && "opacity-0",
                      )}
                    />
                  </span>
                </Link>
              )
            })}
          </div>
        </LayoutGroup>
      </LazyMotion>
      {/* Everything else behind one button. */}
      <Popover>
        <PopoverTrigger
          aria-label={tc("menu")}
          className={cn(
            glass,
            "flex size-14 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors active:text-white data-popup-open:text-white",
          )}
        >
          <Menu className="size-5" />
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={10}
          className="flex w-64 flex-col gap-3 p-3"
        >
          {menu}
        </PopoverContent>
      </Popover>
    </nav>
  )
}
