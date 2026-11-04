"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useQueryClient, type QueryKey } from "@tanstack/react-query"
import { useEffect, useRef } from "react"

type Row = Record<string, unknown>

export type RealtimeWatch = {
  table: string
  /** A postgres_changes filter, e.g. `project_id=eq.<id>`. */
  filter?: string
  /** The queries a change makes stale (`row` is the new row; null for a
   *  delete, which carries only the key). */
  keys: (row: Row | null) => QueryKey[]
}

/**
 * Keeps queries fresh while someone else edits: listens to the tables'
 * changes (Supabase Realtime, RLS applies) and refetches the queries they
 * touch. A burst of changes refetches once. Inserts and updates are
 * filtered; deletes can't be (they carry only the key), so any delete on a
 * watched table refreshes what this view shows.
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
    const queue = (keys: QueryKey[]) => {
      for (const key of keys) pending.set(JSON.stringify(key), key)
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
          (payload: { new: Row }) => queue(keysOf(payload.new)),
        )
      channel = channel.on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: watch.table },
        () => queue(keysOf(null)),
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
