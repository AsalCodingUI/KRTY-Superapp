"use client"

import { useSyncExternalStore } from "react"

/**
 * In-app tabs (docs/ui/navigation.md → Tabs). The first tab, "main", is
 * always there and can't be closed: the sidebar navigates it, like a
 * browser's current tab. Others open from ⌘ / middle click, the + button
 * or ⌘T (Mac app). Each tab keeps its own history, so ‹ › and ⌘[ ⌘] move
 * within the tab. Only the active tab is rendered (it is the page you
 * see); the rest are a URL, a title and a scroll offset, so tabs cost
 * nothing. Saved per user in localStorage.
 */

export const MAIN_TAB = "main"
/** Beyond this, opening a tab drops the oldest one in the background. */
export const MAX_TABS = 10
const MAX_HISTORY = 50

export type TabIcon =
  | { kind: "project"; id: string; name: string }
  | { kind: "nav"; href: string }

export type AppTab = {
  id: string
  url: string
  title: string
  icon?: TabIcon
  /** This tab's own history (URLs) and where it is in it. */
  stack: string[]
  index: number
  scroll?: number
}

type State = { tabs: AppTab[]; active: string }

let state: State = {
  tabs: [{ id: MAIN_TAB, url: "", title: "", stack: [], index: -1 }],
  active: MAIN_TAB,
}
let storageKey: string | null = null
const listeners = new Set<() => void>()

let saveQueued = false
/** Saved when the browser is idle, never in the middle of a switch. */
function persist() {
  if (!storageKey || saveQueued) return
  saveQueued = true
  const run = () => {
    saveQueued = false
    if (!storageKey) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
    } catch {
      // Private mode / full storage: tabs just don't survive a reload.
    }
  }
  if (typeof requestIdleCallback === "function")
    requestIdleCallback(run, { timeout: 1000 })
  else setTimeout(run, 200)
}

function set(next: State) {
  state = next
  listeners.forEach((l) => l())
  persist()
}

function update(id: string, patch: (tab: AppTab) => AppTab) {
  set({
    ...state,
    tabs: state.tabs.map((t) => (t.id === id ? patch(t) : t)),
  })
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getTabs = () => state

export function useAppTabs() {
  return useSyncExternalStore(subscribe, getTabs, getTabs)
}

export const activeTab = () =>
  state.tabs.find((t) => t.id === state.active) ?? state.tabs[0]

/** Path only: a query change (filters, ?tab=) replaces the history entry
 *  instead of adding one, as the pages' own replaceUrl means. */
const pathOf = (url: string) => url.split("?")[0]

/**
 * Load the user's saved tabs once their id is known. The page that loaded
 * is always shown: in the saved tab that has it, else in the main tab.
 */
export function hydrateTabs(userId: string, currentUrl: string) {
  const key = `krty:tabs:v1:${userId}`
  if (storageKey === key) return
  storageKey = key
  let saved: State | null = null
  try {
    saved = JSON.parse(localStorage.getItem(key) ?? "null") as State | null
  } catch {
    saved = null
  }
  const tabs = saved?.tabs?.length
    ? saved.tabs
    : [{ id: MAIN_TAB, url: "", title: "", stack: [], index: -1 }]
  if (!tabs.some((t) => t.id === MAIN_TAB))
    tabs.unshift({ id: MAIN_TAB, url: "", title: "", stack: [], index: -1 })
  const match =
    tabs.find((t) => t.id === saved?.active && t.url === currentUrl) ??
    tabs.find((t) => t.url === currentUrl)
  state = { tabs, active: match?.id ?? MAIN_TAB }
  visit(currentUrl)
}

/** The active tab arrived at `url` (any navigation: link, ‹ ›, browser). */
export function visit(url: string) {
  const tab = activeTab()
  const { stack, index } = tab
  if (stack[index] === url) return
  let nextStack = stack
  let nextIndex = index
  if (stack[index - 1] === url) nextIndex = index - 1
  else if (stack[index + 1] === url) nextIndex = index + 1
  else if (index >= 0 && pathOf(stack[index]) === pathOf(url)) {
    nextStack = [...stack]
    nextStack[index] = url
  } else {
    nextStack = [...stack.slice(0, index + 1), url].slice(-MAX_HISTORY)
    nextIndex = nextStack.length - 1
  }
  update(tab.id, (t) => ({ ...t, url, stack: nextStack, index: nextIndex }))
}

/** Title and icon of the page the active tab shows (once it's there). */
export function describeActive(url: string, title: string, icon?: TabIcon) {
  const tab = activeTab()
  if (tab.url !== url || !title) return
  if (tab.title === title && JSON.stringify(tab.icon) === JSON.stringify(icon))
    return
  update(tab.id, (t) => ({ ...t, title, icon }))
}

export function saveScroll(id: string, scroll: number) {
  const tab = state.tabs.find((t) => t.id === id)
  if (tab && tab.scroll !== scroll) update(id, (t) => ({ ...t, scroll }))
}

let seq = 0
const newId = () => `t${Date.now().toString(36)}${(seq++).toString(36)}`

/** A new tab at `url`; returns its id. In the background unless `focus`. */
export function openTab(
  url: string,
  {
    title = "",
    icon,
    focus = false,
  }: Partial<Pick<AppTab, "title" | "icon">> & {
    focus?: boolean
  } = {},
) {
  const tab: AppTab = { id: newId(), url, title, icon, stack: [], index: -1 }
  let tabs = [...state.tabs]
  // Right after the active tab, as browsers do.
  const at = tabs.findIndex((t) => t.id === state.active) + 1
  tabs.splice(at, 0, tab)
  while (tabs.length > MAX_TABS) {
    const drop = tabs.find(
      (t) => t.id !== MAIN_TAB && t.id !== state.active && t.id !== tab.id,
    )
    if (!drop) break
    tabs = tabs.filter((t) => t !== drop)
  }
  set({ tabs, active: focus ? tab.id : state.active })
  return tab.id
}

/** Make `id` active; returns the URL to navigate to. */
export function selectTab(id: string) {
  const tab = state.tabs.find((t) => t.id === id)
  if (!tab) return null
  set({ ...state, active: id })
  return tab.url || "/dashboard"
}

/** Close `id`; returns the URL to navigate to when it was the active one. */
export function closeTab(id: string) {
  if (id === MAIN_TAB) return null
  const i = state.tabs.findIndex((t) => t.id === id)
  if (i < 0) return null
  const tabs = state.tabs.filter((t) => t.id !== id)
  if (state.active !== id) {
    set({ ...state, tabs })
    return null
  }
  const next = tabs[Math.min(i, tabs.length - 1)] ?? tabs[0]
  set({ tabs, active: next.id })
  return next.url || "/dashboard"
}

/** Where ‹ / › would go in the active tab (null at either end). */
export function historyTarget(step: -1 | 1) {
  const { stack, index } = activeTab()
  return stack[index + step] ?? null
}
