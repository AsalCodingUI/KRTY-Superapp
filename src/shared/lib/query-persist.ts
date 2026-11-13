"use client"

import {
  dehydrate,
  hydrate,
  type DehydratedState,
  type Query,
  type QueryClient,
} from "@tanstack/react-query"

/**
 * The data cache kept on this device (IndexedDB), so a page opened again,
 * or the app opened tomorrow, shows its last data at once while it
 * refreshes. One snapshot per viewer (whose profile, as whom): another
 * person signing in here never sees it; a sign-out clears it
 * (clearQueryCache in after-sign-out).
 *
 * Bump VERSION when a cached shape changes incompatibly.
 */
const VERSION = 1
const MAX_AGE = 24 * 60 * 60 * 1000
const DB = "krty-cache"
const STORE = "kv"
/** One snapshot per surface: Kretya Flow's menu bar popover (/desktop) is
 *  another page on this origin with queries of its own. */
const key = () =>
  location.pathname.startsWith("/desktop")
    ? "react-query:desktop"
    : "react-query:app"
/** A query bigger than this (values walked) isn't kept. */
const MAX_NODES = 40_000
/** Set by a sign-out: nothing more is saved from this page. */
let stopped = false

type Snapshot = {
  version: number
  owner: string
  savedAt: number
  state: DehydratedState
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await open()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}

/** Who the cache belongs to: the signed-in person, as whom they view. */
function ownerOf(client: QueryClient): string | null {
  const session = client.getQueryData<{
    profile?: { id?: string } | null
    authProfile?: { id?: string } | null
  }>(["session-context"])
  const auth = session?.authProfile?.id
  if (!auth) return null
  return `${auth}:${session?.profile?.id ?? auth}`
}

/** Only plain data (what IndexedDB keeps as it is), and not too much. */
function storable(value: unknown): boolean {
  let nodes = 0
  const stack: unknown[] = [value]
  while (stack.length) {
    const v = stack.pop()
    if (++nodes > MAX_NODES) return false
    if (v === null || typeof v !== "object") {
      if (typeof v === "function" || typeof v === "symbol") return false
      continue
    }
    if (v instanceof Date) continue
    if (Array.isArray(v)) {
      for (const item of v) stack.push(item)
      continue
    }
    const proto = Object.getPrototypeOf(v)
    if (proto !== Object.prototype && proto !== null) return false
    for (const key in v) stack.push((v as Record<string, unknown>)[key])
  }
  return true
}

const keep = (query: Query) =>
  query.state.status === "success" &&
  query.queryKey[0] !== "session-context" &&
  query.meta?.persist !== false &&
  storable(query.state.data)

/**
 * Puts the snapshot saved for this viewer back into `client`. Data already
 * there (newer, e.g. from the server) wins; a snapshot of someone else, an
 * old one or another version is dropped.
 */
export async function restoreQueryCache(client: QueryClient) {
  const owner = ownerOf(client)
  if (!owner) return
  const snap = await run<Snapshot | undefined>("readonly", (s) => s.get(key()))
  if (!snap) return
  if (
    snap.version !== VERSION ||
    snap.owner !== owner ||
    Date.now() - snap.savedAt > MAX_AGE
  ) {
    await clearQueryCache()
    return
  }
  hydrate(client, snap.state)
}

/** Saves `client`'s data (plain, successful queries) for this viewer. */
export async function saveQueryCache(client: QueryClient) {
  if (stopped) return
  const owner = ownerOf(client)
  if (!owner) return
  const snap: Snapshot = {
    version: VERSION,
    owner,
    savedAt: Date.now(),
    state: dehydrate(client, { shouldDehydrateQuery: keep }),
  }
  await run("readwrite", (s) => s.put(snap, key()))
}

export async function clearQueryCache({ stop = false } = {}) {
  if (stop) stopped = true
  try {
    await run("readwrite", (s) => s.clear())
  } catch {}
}
