"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * What the viewer has seen of Yang baru, per user, in this browser
 * (localStorage; every access wrapped, since storage can be blocked):
 *
 * - "seen": the newest entry id they had when they last opened the page.
 *   Anything newer is unseen: the sidebar dot and the "Ada yang baru" card.
 * - "read": entry ids they opened (or marked), for "Sudah dibaca".
 *
 * Losing it only means the notice shows once more.
 */

const SEEN = (user: string) => `krty-whats-new-seen:${user}`
const READ = (user: string) => `krty-whats-new-read:${user}`
const EVENT = "krty-whats-new-change"

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage blocked: it lasts for this visit only (no event needed).
  }
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener)
  // Another tab opened the page.
  window.addEventListener("storage", listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener("storage", listener)
  }
}

/** Raw stored string (stable between renders), null on the server. */
function useStored(key: string | null) {
  return useSyncExternalStore(
    subscribe,
    () => (key ? read(key) : null),
    () => null,
  )
}

/** Hydrated: false until the browser value can be read. */
function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}

/**
 * The last seen entry id (undefined before hydration, null when never),
 * and `markSeen(id)`.
 */
export function useLastSeen(userId: string | null | undefined) {
  const key = userId ? SEEN(userId) : null
  const value = useStored(key)
  const hydrated = useHydrated()
  const markSeen = useCallback(
    (id: string) => {
      if (key && read(key) !== id) write(key, id)
    },
    [key],
  )
  return [hydrated && key ? value : undefined, markSeen] as const
}

/** Entry ids the viewer has read, and setters. */
export function useReadEntries(userId: string | null | undefined) {
  const key = userId ? READ(userId) : null
  const raw = useStored(key)
  const ids = parseIds(raw)
  const setRead = useCallback(
    (entryIds: string[], isRead: boolean) => {
      if (!key) return
      const current = new Set(parseIds(read(key)))
      for (const id of entryIds) {
        if (isRead) current.add(id)
        else current.delete(id)
      }
      write(key, JSON.stringify([...current]))
    },
    [key],
  )
  return { ids, setRead }
}

const parsed = new Map<string, string[]>()

/** Same array for the same string, so consumers can memo on it. */
function parseIds(raw: string | null): string[] {
  if (!raw) return EMPTY
  const hit = parsed.get(raw)
  if (hit) return hit
  let ids: string[] = EMPTY
  try {
    const value: unknown = JSON.parse(raw)
    if (Array.isArray(value))
      ids = value.filter((v): v is string => typeof v === "string")
  } catch {
    // Bad value: nothing read yet.
  }
  parsed.set(raw, ids)
  return ids
}

const EMPTY: string[] = []

/**
 * Entries newer than `lastSeen` among `visible` (both in WHATS_NEW order,
 * newest first). Never seen: all of them. Order comes from `all`, so an
 * entry hidden from the viewer can still be the marker.
 */
export function unseenOf<T extends { id: string }>(
  all: readonly { id: string }[],
  visible: readonly T[],
  lastSeen: string | null,
): T[] {
  const cut = lastSeen ? all.findIndex((e) => e.id === lastSeen) : -1
  if (cut === -1) return [...visible]
  const before = new Set(all.slice(0, cut).map((e) => e.id))
  return visible.filter((e) => before.has(e.id))
}
