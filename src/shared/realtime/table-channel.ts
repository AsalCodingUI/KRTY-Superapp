"use client"

import { createClient } from "@/shared/api/supabase/client"
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js"

type Row = Record<string, unknown>
export type TableChange = RealtimePostgresChangesPayload<Row>
export type TableListener = (payload: TableChange) => void

type Entry = {
  channel: RealtimeChannel
  listeners: Set<TableListener>
  closeTimer?: ReturnType<typeof setTimeout>
}

/**
 * Kept open this long after its last subscriber leaves, so a page change
 * that unmounts one view and mounts the next on the same table reuses the
 * channel instead of leaving and joining again.
 */
const CLOSE_GRACE_MS = 1_000

const entries = new Map<string, Entry>()
let generation = 0

/** `col=eq.value` → [col, value]; other filter kinds aren't checked here. */
function parseEqFilter(filter?: string) {
  const match = filter?.match(/^([^=]+)=eq\.(.*)$/)
  return match ? ([match[1], match[2]] as const) : null
}

function open(key: string, table: string, filter?: string): Entry {
  const supabase = createClient()
  const listeners = new Set<TableListener>()
  const emit = (payload: TableChange) => {
    // A copy: a listener may unsubscribe while we iterate.
    for (const listener of [...listeners]) listener(payload)
  }
  // supabase-js hands back an existing channel for a topic it still holds
  // (one leaving, or someone else's with the same name). Never share one we
  // don't own: take a fresh topic instead, so closing ours can't close theirs.
  const base = filter ? `${table}:${filter}` : table
  const taken = (topic: string) =>
    supabase
      .getChannels()
      .some((c: RealtimeChannel) => c.topic === `realtime:${topic}`)
  let topic = base
  while (taken(topic)) topic = `${base}#${++generation}`

  let channel = supabase.channel(topic)
  if (!filter) {
    channel = channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      emit,
    )
  } else {
    // Inserts and updates are filtered by the server. Deletes can't be:
    // they're checked here against the old row when it carries the filter's
    // column (replica identity full); one carrying only the key passes.
    for (const event of ["INSERT", "UPDATE"] as const)
      channel = channel.on(
        "postgres_changes",
        { event, schema: "public", table, filter },
        emit,
      )
    const eq = parseEqFilter(filter)
    channel = channel.on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table },
      (payload: TableChange) => {
        const old = payload.old as Row | undefined
        if (eq && old && eq[0] in old && String(old[eq[0]]) !== eq[1]) return
        emit(payload)
      },
    )
  }
  channel.subscribe()
  const entry: Entry = { channel, listeners }
  entries.set(key, entry)
  return entry
}

/**
 * Listens to a table's changes (Supabase Realtime, RLS applies) on a
 * channel shared across the app: one per table (and filter), opened by its
 * first subscriber and closed after its last one leaves. Returns the
 * unsubscribe; calling it twice is harmless, and it only ever removes this
 * listener, so subscribers never close each other's channel.
 */
export function subscribeTable(
  table: string,
  filter: string | undefined,
  listener: TableListener,
): () => void {
  const key = `${table}|${filter ?? ""}`
  const entry = entries.get(key) ?? open(key, table, filter)
  if (entry.closeTimer) {
    clearTimeout(entry.closeTimer)
    entry.closeTimer = undefined
  }
  // Wrapped: the same function subscribed twice still counts twice.
  const own: TableListener = (payload) => listener(payload)
  entry.listeners.add(own)

  let done = false
  return () => {
    if (done) return
    done = true
    entry.listeners.delete(own)
    if (entry.listeners.size > 0 || entry.closeTimer) return
    entry.closeTimer = setTimeout(() => {
      entry.closeTimer = undefined
      if (entry.listeners.size > 0 || entries.get(key) !== entry) return
      entries.delete(key)
      void createClient().removeChannel(entry.channel)
    }, CLOSE_GRACE_MS)
  }
}
