"use client"

import { createClient } from "@/shared/api/supabase/client"
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

/** `col=eq.value` → [col, value]; other filter kinds aren't checked here. */
function parseEqFilter(filter?: string) {
  const match = filter?.match(/^([^=]+)=eq\.(.*)$/)
  return match ? ([match[1], match[2]] as const) : null
}

/**
 * Keeps queries fresh while someone else edits: listens to the tables'
 * changes (Supabase Realtime, RLS applies) and refetches the queries they
 * touch. A burst of changes refetches once. Inserts and updates are
 * filtered by the server. Deletes can't be: they're checked here against
 * the old row when it carries the filter's column (replica identity full);
 * one that carries only the key still refreshes what this view shows.
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
    const supabase = createClient()
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

    let channel = supabase.channel(
      `rt:${name}:${Math.random().toString(36).slice(2, 8)}`,
    )
    latest.current.forEach((watch, i) => {
      const keysOf = (row: Row | null) => latest.current[i]?.keys(row) ?? []
      for (const event of ["INSERT", "UPDATE"] as const)
        channel = channel.on(
          "postgres_changes",
          {
            event,
            schema: "public",
            table: watch.table,
            ...(watch.filter ? { filter: watch.filter } : {}),
          },
          (payload: { new: Row }) =>
            queue(keysOf(payload.new), echoedKeys(watch.table, payload.new)),
        )
      const eq = parseEqFilter(watch.filter)
      channel = channel.on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: watch.table },
        (payload: { old?: Row }) => {
          const old =
            payload.old && Object.keys(payload.old).length ? payload.old : null
          // Another project's row (the old row says so): not ours to refresh.
          if (eq && old && eq[0] in old && String(old[eq[0]]) !== eq[1]) return
          queue(keysOf(old), echoedKeys(watch.table, old))
        },
      )
    })
    channel.subscribe()
    return () => {
      clearTimeout(timer)
      void supabase.removeChannel(channel)
    }
    // Resubscribes when the tables or filters change, not the callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, signature, enabled, queryClient])
}
