"use client"

import { useEffect, useState, type RefObject } from "react"

/**
 * Shared plumbing for file thumbnails that download and parse the file in
 * the browser (PDF, Word, Excel): tiles start only once they're near the
 * viewport, at most a few render at once, and results are kept in memory
 * per storage path so coming back to a tab doesn't redo the work.
 */

const MAX_CONCURRENT = 3
let active = 0
const waiting: (() => void)[] = []

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++
    return Promise.resolve()
  }
  // The slot is handed over directly by `release`.
  return new Promise((resolve) => waiting.push(resolve))
}

function release() {
  const next = waiting.shift()
  if (next) next()
  else active--
}

/** Runs `task` when a thumbnail slot is free (max 3 at once). */
export async function runThumbnail<T>(task: () => Promise<T>): Promise<T> {
  await acquire()
  try {
    return await task()
  } finally {
    release()
  }
}

/** A small LRU so a long-lived tab doesn't hold every thumbnail forever. */
export function thumbnailCache<V>(max = 80) {
  const map = new Map<string, V>()
  return {
    get(key: string | null | undefined) {
      if (!key) return undefined
      const value = map.get(key)
      if (value !== undefined) {
        map.delete(key)
        map.set(key, value)
      }
      return value
    },
    set(key: string | null | undefined, value: V) {
      if (!key) return
      map.delete(key)
      map.set(key, value)
      if (map.size > max) map.delete(map.keys().next().value as string)
    },
  }
}

/**
 * True once `ref` comes within `rootMargin` of the viewport (then stays
 * true). Without IntersectionObserver it is true right away.
 */
export function useInView(
  ref: RefObject<Element | null>,
  rootMargin = "200px",
) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (seen) return
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, rootMargin, seen])
  return seen
}
