"use client"

import { createClient } from "@/shared/api/supabase/client"
import { useCallback, useEffect, useRef, useState } from "react"

/** How often a typist says "still typing", and when they're forgotten. */
const PING_MS = 2000
const FORGET_MS = 4000

type Typist = { id: string; name: string }

/**
 * "Someone is typing" for one thread, over a Realtime broadcast channel
 * (nothing is stored). Each typist pings at most every 2 s while typing and
 * is dropped 4 s after their last ping (or at once when they send or
 * leave), so any number of people typing at once stays a few small
 * messages, and the list never sticks.
 */
export function useTypingIndicator(topic: string | null, me: Typist | null) {
  const [others, setOthers] = useState<Typist[]>([])
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null)
  const lastPing = useRef(0)
  const seen = useRef(new Map<string, { name: string; at: number }>())
  const meRef = useRef(me)
  meRef.current = me

  useEffect(() => {
    if (!topic || !me?.id) return
    const supabase = createClient()
    const typists = seen.current
    const sync = () =>
      setOthers([...typists.entries()].map(([id, v]) => ({ id, name: v.name })))
    const channel = supabase
      .channel(`typing:${topic}`, { config: { broadcast: { self: false } } })
      .on(
        "broadcast",
        { event: "typing" },
        ({ payload }: { payload: unknown }) => {
          const p = payload as { id?: string; name?: string; stop?: boolean }
          if (!p.id || p.id === meRef.current?.id) return
          if (p.stop) typists.delete(p.id)
          else typists.set(p.id, { name: p.name ?? "", at: Date.now() })
          sync()
        },
      )
      .subscribe()
    channelRef.current = channel
    const sweep = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [id, v] of typists)
        if (now - v.at > FORGET_MS) {
          typists.delete(id)
          changed = true
        }
      if (changed) sync()
    }, 1000)
    return () => {
      clearInterval(sweep)
      const who = meRef.current
      if (who)
        void channel.send({
          type: "broadcast",
          event: "typing",
          payload: { id: who.id, stop: true },
        })
      void supabase.removeChannel(channel)
      channelRef.current = null
      typists.clear()
      setOthers([])
    }
  }, [topic, me?.id])

  /** Call on each keystroke; pings at most every 2 s. */
  const typing = useCallback(() => {
    const who = meRef.current
    const now = Date.now()
    if (!who || !channelRef.current || now - lastPing.current < PING_MS) return
    lastPing.current = now
    void channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { id: who.id, name: who.name },
    })
  }, [])

  /** Call when the comment is sent (or the field is left). */
  const stopped = useCallback(() => {
    const who = meRef.current
    lastPing.current = 0
    if (!who || !channelRef.current) return
    void channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { id: who.id, stop: true },
    })
  }, [])

  return { others, typing, stopped }
}
