"use client"

import { subscribeTable } from "@/shared/realtime/table-channel"
import { useQueryClient, type QueryKey } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

type Row = Record<string, unknown>

export type RealtimeWatch = {
  table: string
  /** A postgres_changes filter, e.g. `project_id=eq.<id>`. */
  filter?: string
  /** The queries a change makes stale (`row` is the new row; for a delete
   *  the old one, which may carry only the key, or null). */
  keys: (row: Row | null) => QueryKey[]
}

/** How long a local write's own echo is expected back from Realtime. */
const ECHO_MS = 1500

type LocalWrite = {
  table: string
  ids: Set<string>
  keys: Set<string>
  until: number
}
const localWrites: LocalWrite[] = []

/**
 * Marks rows this tab just wrote and the queries the writer refreshes
 * itself: their Realtime echo, arriving within ~1.5 s, then skips those
 * queries instead of fetching them a second time. Only these rows are
 * skipped, so a teammate's change to other rows still refreshes.
 */
export function markLocalWrite(table: string, ids: string[], keys: QueryKey[]) {
  const now = Date.now()
  for (let i = localWrites.length - 1; i >= 0; i--)
    if (localWrites[i].until < now) localWrites.splice(i, 1)
  localWrites.push({
    table,
    ids: new Set(ids),
    keys: new Set(keys.map((k) => JSON.stringify(k))),
    until: now + ECHO_MS,
  })
}

/** The query keys (serialized) a local write of this row already refreshes. */
function echoedKeys(table: string, row: Row | null) {
  const id = row?.id
  const skip = new Set<string>()
  if (id == null) return skip
  const now = Date.now()
  for (const write of localWrites)
    if (
      write.until >= now &&
      write.table === table &&
      write.ids.has(String(id))
    )
      write.keys.forEach((k) => skip.add(k))
  return skip
}

/**
 * Keeps queries fresh while someone else edits: listens to the tables'
 * changes (Supabase Realtime, RLS applies) and refetches the queries they
 * touch. A burst of changes refetches once. Every view on the same table
 * (and filter) shares one channel (see subscribeTable), which also checks
 * filtered deletes against the old row.
 */
export function useRealtimeRefresh(
  name: string,
  watches: RealtimeWatch[],
  enabled = true,
) {
  const queryClient = useQueryClient()
  // The latest watches, without resubscribing on every render.
  const latest = useRef(watches)
  latest.current = watches
  const signature = watches.map((w) => `${w.table}:${w.filter ?? ""}`).join("|")

  useEffect(() => {
    if (!enabled) return
    const pending = new Map<string, QueryKey>()
    let timer: ReturnType<typeof setTimeout> | undefined
    const queue = (keys: QueryKey[], skip?: Set<string>) => {
      let added = false
      for (const key of keys) {
        const id = JSON.stringify(key)
        if (skip?.has(id)) continue
        pending.set(id, key)
        added = true
      }
      if (!added) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        for (const key of pending.values())
          void queryClient.invalidateQueries({ queryKey: key })
        pending.clear()
      }, 250)
    }

    const unsubscribes = latest.current.map((watch, i) =>
      subscribeTable(watch.table, watch.filter, (payload) => {
        let row: Row | null
        if (payload.eventType === "DELETE") {
          const old = payload.old as Row | undefined
          row = old && Object.keys(old).length ? old : null
        } else row = payload.new as Row
        queue(latest.current[i]?.keys(row) ?? [], echoedKeys(watch.table, row))
      }),
    )
    return () => {
      clearTimeout(timer)
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
    // Resubscribes when the tables or filters change, not the callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, signature, enabled, queryClient])
}
