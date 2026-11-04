"use client"

import { ChevronLeft, ChevronRight, Plus, X } from "@/components/icons"
import { ProjectAvatar } from "@/components/project-avatar"
import { useDesktopShell } from "@/components/desktop-shell"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useUserProfile } from "@/shared/hooks/useUserProfile"
import { useT } from "@/shared/i18n/client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react"
import {
  activeTab,
  closeTab,
  describeActive,
  getTabs,
  historyTarget,
  hydrateTabs,
  MAIN_TAB,
  openTab,
  saveScroll,
  selectTab,
  useAppTabs,
  visit,
  type AppTab,
  type TabIcon,
} from "../model/tabs-store"

/** Fired by the right-click menu's "Buka di tab baru" (shared can't import
 *  widgets). */
export const OPEN_TAB_EVENT = "krty:open-tab"

const DEFAULT_URL = "/dashboard"
const DESKTOP_MIN = "(min-width: 768px)"

/** The page sheet scrolls, not the window. */
const scroller = () =>
  document.querySelector<HTMLElement>('[data-slot="sidebar-inset"]')

/** Current URL as a tab keeps it: Settings (?settings=) is an overlay on
 *  the page, not a place, so it stays out. */
function useCurrentUrl() {
  const pathname = usePathname()
  const params = useSearchParams()
  const search = new URLSearchParams(params.toString())
  search.delete("settings")
  const q = search.toString()
  return q ? `${pathname}?${q}` : pathname
}

/** Links that open as an in-app tab on ⌘ / Ctrl / middle click. */
function tabbableHref(a: HTMLAnchorElement) {
  if (a.target && a.target !== "_self") return null
  if (a.hasAttribute("download")) return null
  const url = new URL(a.href, window.location.href)
  if (url.origin !== window.location.origin) return null
  if (/^\/(api|auth|login|r)(\/|$)/.test(url.pathname)) return null
  return url.pathname + url.search
}

/**
 * Keeps the tabs in step with the router: every navigation lands in the
 * active tab's history, the page's title and icon name the tab, ⌘ / middle
 * click open links as tabs, and the shortcuts.
 */
export function useAppTabsSync({
  title,
  icon,
}: {
  title: string
  icon?: TabIcon
}) {
  const url = useCurrentUrl()
  const { profile } = useUserProfile()
  const desktop = useDesktopShell()
  const nav = useTabNavigation()

  // First the saved tabs (once the viewer is known), then every arrival.
  useEffect(() => {
    if (profile?.id) hydrateTabs(profile.id, url)
    // Only when the viewer changes; later URLs go through visit().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])
  useEffect(() => {
    visit(url)
    nav.restoreScroll()
  }, [url, nav])
  useEffect(() => {
    describeActive(url, title, icon)
  }, [url, title, icon])

  // ⌘ / Ctrl / middle click on an app link: a tab in the background.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const middle = e.type === "auxclick" && e.button === 1
      const modified =
        e.type === "click" && e.button === 0 && (e.metaKey || e.ctrlKey)
      if (!middle && !modified) return
      if (!window.matchMedia(DESKTOP_MIN).matches) return
      const a = (e.target as Element | null)?.closest?.("a[href]")
      if (!(a instanceof HTMLAnchorElement)) return
      const href = tabbableHref(a)
      if (!href) return
      e.preventDefault()
      const label = (a.getAttribute("aria-label") || a.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60)
      openTab(href, { title: label })
    }
    const onOpen = (e: Event) => {
      const { url: href, title: label } = (
        e as CustomEvent<{
          url: string
          title?: string
        }>
      ).detail
      openTab(href, { title: label ?? "" })
    }
    document.addEventListener("click", onClick, true)
    document.addEventListener("auxclick", onClick, true)
    window.addEventListener(OPEN_TAB_EVENT, onOpen)
    return () => {
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("auxclick", onClick, true)
      window.removeEventListener(OPEN_TAB_EVENT, onOpen)
    }
  }, [])

  // ⌘[ / ⌘] everywhere (they mean back / forward in browsers too). The
  // tab shortcuts only in the desktop app: browsers keep ⌘T, ⌘W and ⌘1–9.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const target = e.target as HTMLElement | null
      const editing = !!target?.closest?.(
        "input, textarea, select, [contenteditable=''], [contenteditable='true']",
      )
      if (mod && !e.shiftKey && !e.altKey && (e.key === "[" || e.key === "]")) {
        if (editing) return
        e.preventDefault()
        nav.go(e.key === "[" ? -1 : 1)
        return
      }
      if (!desktop) return
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault()
        const { tabs, active } = getTabs()
        const i = tabs.findIndex((t) => t.id === active)
        const next =
          tabs[(i + (e.shiftKey ? -1 : 1) + tabs.length) % tabs.length]
        nav.select(next.id)
        return
      }
      if (!mod || e.shiftKey || e.altKey) return
      if (e.key === "t") {
        e.preventDefault()
        nav.newTab()
      } else if (e.key === "w" && getTabs().active !== MAIN_TAB) {
        e.preventDefault()
        nav.close(getTabs().active)
      } else if (/^[1-9]$/.test(e.key)) {
        const { tabs } = getTabs()
        // ⌘9 is the last tab, as in browsers.
        const tab = e.key === "9" ? tabs.at(-1) : tabs[Number(e.key) - 1]
        if (!tab) return
        e.preventDefault()
        nav.select(tab.id)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [desktop, nav])
}

/** Moving between tabs and through a tab's history. */
let pendingScroll: { id: string; top: number } | null = null

function useTabNavigation() {
  const router = useRouter()
  const ref = useRef<{
    go: (step: -1 | 1) => void
    select: (id: string) => void
    close: (id: string) => void
    newTab: () => void
    restoreScroll: () => void
  } | null>(null)
  const leave = useCallback(() => {
    const el = scroller()
    if (el) saveScroll(getTabs().active, el.scrollTop)
  }, [])
  const goTo = useCallback(
    (url: string | null) => {
      if (!url) return
      const tab = activeTab()
      pendingScroll = { id: tab.id, top: tab.scroll ?? 0 }
      router.push(url, { scroll: false })
    },
    [router],
  )
  ref.current ??= {
    go: () => {},
    select: () => {},
    close: () => {},
    newTab: () => {},
    restoreScroll: () => {},
  }
  const api = ref.current
  api.go = (step) => {
    const url = historyTarget(step)
    if (!url) return
    router.push(url)
  }
  api.select = (id) => {
    if (id === getTabs().active) return
    leave()
    goTo(selectTab(id))
  }
  api.close = (id) => {
    const wasActive = id === getTabs().active
    const url = closeTab(id)
    if (wasActive) goTo(url)
  }
  api.newTab = () => {
    leave()
    openTab(DEFAULT_URL, { focus: true })
    pendingScroll = null
    router.push(DEFAULT_URL)
  }
  api.restoreScroll = () => {
    const p = pendingScroll
    if (!p || p.id !== getTabs().active) return
    pendingScroll = null
    // Twice: once now, once after the page's data has painted.
    const apply = () => {
      const el = scroller()
      if (el) el.scrollTop = p.top
    }
    requestAnimationFrame(apply)
    setTimeout(apply, 350)
  }
  return api
}

function ShortcutTip({
  label,
  keys,
  children,
}: {
  label: string
  keys?: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children as React.ReactElement} />
      <TooltipContent side="bottom" className="flex items-center gap-2">
        {label}
        {keys && <Kbd>{keys}</Kbd>}
      </TooltipContent>
    </Tooltip>
  )
}

/** ‹ › for the active tab's history. */
export function TabHistoryButtons({
  compact = false,
}: {
  /** 24px buttons (the sidebar's brand row is tight). */
  compact?: boolean
}) {
  const t = useT("shell")
  const nav = useTabNavigation()
  const tabs = useAppTabs()
  const tab = tabs.tabs.find((x) => x.id === tabs.active) ?? tabs.tabs[0]
  const mod = useModKey()
  return (
    <div className="flex items-center">
      <ShortcutTip label={t("tabBack")} keys={`${mod}[`}>
        <Button
          variant="ghost"
          size={compact ? "icon-xs" : "icon-sm"}
          className="hover:bg-chrome-hover [&_svg]:size-4"
          aria-label={t("tabBack")}
          disabled={tab.index <= 0}
          onClick={() => nav.go(-1)}
        >
          <ChevronLeft />
        </Button>
      </ShortcutTip>
      <ShortcutTip label={t("tabForward")} keys={`${mod}]`}>
        <Button
          variant="ghost"
          size={compact ? "icon-xs" : "icon-sm"}
          className="hover:bg-chrome-hover [&_svg]:size-4"
          aria-label={t("tabForward")}
          disabled={tab.index >= tab.stack.length - 1}
          onClick={() => nav.go(1)}
        >
          <ChevronRight />
        </Button>
      </ShortcutTip>
    </div>
  )
}

function useModKey() {
  const [mod, setMod] = useState("⌘")
  useEffect(() => {
    if (!/Mac|iPhone|iPad/.test(navigator.platform)) setMod("Ctrl+")
  }, [])
  return mod
}

/** The tab strip: Main first (no close), then the others, then +. */
export function TabStrip({
  navIcon,
}: {
  /** The sidebar's icon for a nav href (pages that aren't a project). */
  navIcon: (href: string) => ComponentType<{ className?: string }> | null
}) {
  const t = useT("shell")
  const { tabs, active } = useAppTabs()
  const nav = useTabNavigation()
  const desktop = useDesktopShell()
  const mod = useModKey()
  // Only the active tab's name is known for sure; others keep the last one.
  const activeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [active])

  return (
    <div className="flex min-w-0 flex-1 items-stretch">
      {/* Flush with the sheet's left edge (the first tab, when active,
          squares the sheet's corner: globals.css); pr-3 for the right
          foot. */}
      <div
        role="tablist"
        aria-label={t("tabs")}
        className="no-scrollbar flex min-w-0 items-end overflow-x-auto pr-3"
      >
        {tabs.map((tab, i) => (
          <TabItem
            // A hairline between two tabs that are both on the chrome.
            divider={
              tab.id !== active &&
              i < tabs.length - 1 &&
              tabs[i + 1].id !== active
            }
            key={tab.id}
            ref={tab.id === active ? activeRef : undefined}
            tab={tab}
            active={tab.id === active}
            onlyOne={tabs.length === 1}
            navIcon={navIcon}
            onSelect={() => nav.select(tab.id)}
            onClose={() => nav.close(tab.id)}
            closeLabel={t("tabClose")}
            mainLabel={t("tabMain")}
          />
        ))}
      </div>
      <ShortcutTip label={t("tabNew")} keys={desktop ? `${mod}T` : undefined}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("tabNew")}
          className="text-muted-foreground hover:bg-chrome-hover shrink-0 self-center"
          onClick={() => nav.newTab()}
        >
          <Plus />
        </Button>
      </ShortcutTip>
    </div>
  )
}

function TabItem({
  ref,
  divider,
  tab,
  active,
  onlyOne,
  navIcon,
  onSelect,
  onClose,
  closeLabel,
  mainLabel,
}: {
  ref?: React.Ref<HTMLDivElement>
  divider: boolean
  tab: AppTab
  active: boolean
  onlyOne: boolean
  navIcon: (href: string) => ComponentType<{ className?: string }> | null
  onSelect: () => void
  onClose: () => void
  closeLabel: string
  mainLabel: string
}) {
  const main = tab.id === MAIN_TAB
  const title = tab.title || (main ? mainLabel : "…")
  const Icon = tab.icon?.kind === "nav" ? navIcon(tab.icon.href) : null
  return (
    <div
      ref={ref}
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      title={title}
      onClick={onSelect}
      onAuxClick={(e) => {
        // Middle click closes, as in browsers.
        if (e.button === 1 && !main) {
          e.preventDefault()
          onClose()
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        "group/tab text-body relative flex min-w-0 shrink-0 cursor-default items-center gap-2 pl-3 transition-colors select-none",
        // One tab: as wide as its name; several share the room.
        onlyOne ? "max-w-60 pr-3.5" : "w-48 max-w-48 pr-1.5",
        main && !onlyOne && "pr-3.5",
        active
          ? // Cut from the sheet: its color, square at the bottom, a
            // concave foot each side so it flows into the sheet's top
            // edge; 1px lower and above the sheet's shadow ring.
            cn(
              "rounded-t-card z-30 -mb-px h-[calc(2.25rem+1px)] bg-(--sheet) font-medium text-(--sheet-foreground)",
              "before:pointer-events-none before:absolute before:bottom-0 before:-left-3 before:size-3 before:bg-[radial-gradient(circle_at_0_0,transparent_0.75rem,var(--sheet)_calc(0.75rem+0.5px))]",
              "after:pointer-events-none after:absolute after:-right-3 after:bottom-0 after:size-3 after:bg-[radial-gradient(circle_at_100%_0,transparent_0.75rem,var(--sheet)_calc(0.75rem+0.5px))]",
            )
          : "text-muted-foreground hover:text-foreground rounded-control [@media(hover:hover)]:hover:bg-chrome-hover mb-1 h-8",
        // The first tab starts at the sheet's corner: no left foot.
        "first:before:hidden",
      )}
    >
      {tab.icon?.kind === "project" ? (
        <ProjectAvatar
          id={tab.icon.id}
          name={tab.icon.name}
          className="size-4 shrink-0"
        />
      ) : Icon ? (
        <Icon className="size-4 shrink-0" />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {divider && (
        <span
          aria-hidden
          className="bg-chrome-border pointer-events-none absolute top-1/2 right-0 h-4 w-px -translate-y-1/2"
        />
      )}
      {!main && !onlyOne && (
        <button
          type="button"
          aria-label={`${closeLabel}: ${title}`}
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-[color-mix(in_oklab,currentColor_10%,transparent)] hover:opacity-100",
            !active &&
              "opacity-0 group-hover/tab:opacity-60 focus-visible:opacity-60",
          )}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
