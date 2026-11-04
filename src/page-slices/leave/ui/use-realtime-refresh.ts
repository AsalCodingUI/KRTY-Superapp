"use client"

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

type Row = Record<string, unknown>
export type ChangePayload = RealtimePostgresChangesPayload<Row>

/** Same value, allowing for two spellings of one timestamp. */
function sameValue(a: unknown, b: unknown) {
  if (a === b) return true
  if (typeof a !== "string" || typeof b !== "string") return false
  const ta = Date.parse(a)
  return !Number.isNaN(ta) && ta === Date.parse(b)
}

/**
 * Whether a change is already on screen: the row as it now stands is in
 * `rows` with the same values (typically our own write, applied locally
 * before its realtime echo), or a deleted row is no longer there.
 */
export function isShownChange(rows: readonly object[], payload: ChangePayload) {
  const list = rows as readonly Row[]
  if (payload.eventType === "DELETE") {
    const id = payload.old?.id
    return id !== undefined && !list.some((r) => r.id === id)
  }
  const next = payload.new
  const local = list.find((r) => r.id === next.id)
  if (!local) return false
  return Object.keys(next).every(
    (key) => !(key in local) || sameValue(local[key], next[key]),
  )
}

/**
 * router.refresh() for realtime changes, debounced: a burst (clock-in,
 * break, several approvals) re-renders the server page once. With
 * `isShown`, a burst whose changes are all already on screen (checked when
 * the timer fires, so a local update that lands after the event counts)
 * doesn't refresh at all.
 */
export function useRealtimeRefresh(
  delay = 1_000,
  isShown?: (payload: ChangePayload) => boolean,
) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<ChangePayload[]>([])
  const isShownRef = useRef(isShown)
  useEffect(() => {
    isShownRef.current = isShown
  })
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  return useCallback(
    (payload: ChangePayload) => {
      pending.current.push(payload)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        const batch = pending.current
        pending.current = []
        const check = isShownRef.current
        if (!check || batch.some((p) => !check(p))) router.refresh()
      }, delay)
    },
    [router, delay],
  )
}
