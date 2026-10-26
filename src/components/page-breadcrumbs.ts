"use client"

import { useEffect, useSyncExternalStore } from "react"

/**
 * Extra breadcrumb steps a page adds after its section in the site header,
 * e.g. Aturan › Cuti melahirkan › Edit. The last step is the current page.
 */
export type Crumb = { label: string; href?: string }

let current: Crumb[] = []
const listeners = new Set<() => void>()

function emit(next: Crumb[]) {
  current = next
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const EMPTY: Crumb[] = []

export function useBreadcrumbTrail() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => EMPTY,
  )
}

/** Sets the page's steps while it is mounted. `null` leaves them alone
 *  (e.g. a detail shown in a sheet over a page that has its own steps). */
export function useBreadcrumbs(crumbs: Crumb[] | null) {
  const key = crumbs ? JSON.stringify(crumbs) : null
  useEffect(() => {
    if (key === null) return
    emit(JSON.parse(key) as Crumb[])
    return () => emit(EMPTY)
  }, [key])
}
