"use client"

import { ChevronLeft, ChevronRight, Plus, X } from "@/components/icons"
import { ProjectAvatar } from "@/components/project-avatar"
import { useDesktopShell } from "@/components/desktop-shell"
import { ContextTarget } from "@/shared/context-menu"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
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
  closeAll,
  closeOthers,
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
  const router = useRouter()
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

  // Every tab's page prefetched in the background (idle), so switching
  // to it renders at once instead of waiting on the server.
  const tabsState = useAppTabs()
  const prefetchKey = tabsState.tabs.map((t) => t.url).join("|")
  useEffect(() => {
    const urls = getTabs()
      .tabs.filter((t) => t.id !== getTabs().active && t.url)
      .map((t) => t.url)
    if (!urls.length) return
    const run = () => urls.forEach((u) => router.prefetch(u))
    // Safari has no requestIdleCallback.
    const idle = typeof requestIdleCallback === "function"
    const id = idle
      ? requestIdleCallback(run, { timeout: 2000 })
      : setTimeout(run, 300)
    return () => {
      if (idle) cancelIdleCallback(id as number)
      else clearTimeout(id)
    }
  }, [prefetchKey, router])

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
      if (mod && e.shiftKey && !e.altKey && e.key.toLowerCase() === "w") {
        e.preventDefault()
        nav.closeAll()
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
    closeOthers: (id: string) => void
    closeAll: () => void
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
      // The tab lights up this frame; the route renders on the next one,
      // so the press never waits on the page.
      requestAnimationFrame(() => router.push(url, { scroll: false }))
    },
    [router],
  )
  ref.current ??= {
    go: () => {},
    select: () => {},
    close: () => {},
    closeOthers: () => {},
    closeAll: () => {},
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
  api.closeOthers = (id) => {
    if (getTabs().active !== id) leave()
    goTo(closeOthers(id))
  }
  api.closeAll = () => {
    if (getTabs().active !== MAIN_TAB) leave()
    goTo(closeAll())
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
  describe,
}: {
  /** Section title + href for a URL (tabs opened but not visited yet). */
  describe: (url: string) => { title: string; href: string } | null
  /** The sidebar's icon for a nav href (pages that aren't a project). */
  navIcon: (href: string) => ComponentType<{ className?: string }> | null
}) {
  const t = useT("shell")
  const { tabs, active } = useAppTabs()
  const nav = useTabNavigation()
  const router = useRouter()
  const currentUrl = useCurrentUrl()
  const desktop = useDesktopShell()
  const mod = useModKey()
  // Only the active tab's name is known for sure; others keep the last one.
  const activeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [active])

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      {/* Flush with the sheet's left edge. */}
      <div
        role="tablist"
        aria-label={t("tabs")}
        className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto"
      >
        {tabs.map((tab) => (
          <ContextTarget
            key={tab.id}
            type="app-tab"
            id={tab.id}
            label={t("tabs")}
            items={() => [
              {
                id: "tab-close",
                label: t("tabClose"),
                icon: X,
                shortcut: desktop ? "Mod+W" : undefined,
                hidden: tab.id === MAIN_TAB,
                onSelect: () => nav.close(tab.id),
              },
              {
                id: "tab-close-others",
                label: t("tabCloseOthers"),
                disabled: tabs.every(
                  (x) => x.id === MAIN_TAB || x.id === tab.id,
                ),
                onSelect: () => nav.closeOthers(tab.id),
              },
              {
                id: "tab-close-all",
                label: t("tabCloseAll"),
                shortcut: desktop ? "Mod+Shift+W" : undefined,
                disabled: tabs.length < 2,
                onSelect: () => nav.closeAll(),
              },
            ]}
          >
            <TabItem
              ref={tab.id === active ? activeRef : undefined}
              tab={tab}
              active={tab.id === active}
              onlyOne={tabs.length === 1}
              navIcon={navIcon}
              describe={describe}
              // Switching to it, or just opened: until its page has rendered.
              loading={tab.id === active && !!tab.url && tab.url !== currentUrl}
              onSelect={() => nav.select(tab.id)}
              onWarm={() => tab.url && router.prefetch(tab.url)}
              onClose={() => nav.close(tab.id)}
              closeLabel={t("tabClose")}
              mainLabel={t("tabMain")}
            />
          </ContextTarget>
        ))}
      </div>
      <ShortcutTip label={t("tabNew")} keys={desktop ? `${mod}T` : undefined}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("tabNew")}
          className="text-muted-foreground hover:bg-chrome-hover shrink-0"
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
  tab,
  active,
  onlyOne,
  navIcon,
  describe,
  loading,
  onSelect,
  onWarm,
  onClose,
  closeLabel,
  mainLabel,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>
  tab: AppTab
  active: boolean
  onlyOne: boolean
  navIcon: (href: string) => ComponentType<{ className?: string }> | null
  describe: (url: string) => { title: string; href: string } | null
  loading: boolean
  onSelect: () => void
  onWarm: () => void
  onClose: () => void
  closeLabel: string
  mainLabel: string
}) {
  const main = tab.id === MAIN_TAB
  const fallback = tab.url ? describe(tab.url) : null
  const title = tab.title || fallback?.title || (main ? mainLabel : "…")
  const iconHref =
    tab.icon?.kind === "nav" ? tab.icon.href : !tab.icon ? fallback?.href : null
  const Icon = iconHref ? navIcon(iconHref) : null
  return (
    <div
      // data-ctx-* from <ContextTarget> (the right-click menu).
      {...rest}
      ref={ref}
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      title={title}
      // Switch on press, not release: ~100ms sooner, as browsers do.
      onPointerDown={(e) => {
        if (e.button === 0 && !(e.target as HTMLElement).closest("button"))
          onSelect()
      }}
      onPointerEnter={onWarm}
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
        "group/tab text-meta rounded-control relative flex h-8 min-w-0 shrink-0 cursor-default items-center gap-1.5 pl-3 transition-colors select-none",
        // One tab: as wide as its name; several share the room.
        onlyOne ? "max-w-56 pr-3" : "w-44 max-w-44 pr-1",
        main && !onlyOne && "pr-3",
        // The active tab: a raised white pill (the sidebar's selected row
        // is the flat darker fill); the others plain text on the chrome.
        active
          ? "bg-chrome-active shadow-raised text-foreground"
          : "text-muted-foreground hover:text-foreground [@media(hover:hover)]:hover:bg-chrome-hover",
      )}
    >
      {loading ? (
        <Spinner className="size-3.5 shrink-0" />
      ) : tab.icon?.kind === "project" ? (
        <ProjectAvatar
          id={tab.icon.id}
          name={tab.icon.name}
          className="size-3.5 shrink-0"
        />
      ) : Icon ? (
        <Icon className="size-3.5 shrink-0" />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{title}</span>
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
            "flex size-5 shrink-0 items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-[color-mix(in_oklab,currentColor_10%,transparent)] hover:opacity-100",
            !active &&
              "opacity-0 group-hover/tab:opacity-60 focus-visible:opacity-60",
          )}
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
