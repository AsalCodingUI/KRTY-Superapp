"use client"

import { useRealtimeRefresh } from "@/shared/hooks/useRealtimeRefresh"
import { createClient } from "@/shared/api/supabase/client"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import {
  reanchor,
  todayIn,
  type SantuySettings,
  type SantuyWeek,
} from "@/shared/lib/santuy"
import { useQuery } from "@tanstack/react-query"

/**
 * Sharing Santuy data: settings, the queue and per-week exceptions (see
 * migrations/sharing_santuy.sql), plus everyone's name and avatar. The
 * schedule is computed from these by shared/lib/santuy.ts.
 */

export const santuyKey = ["santuy"] as const

export type SantuyPerson = {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  created_at: string | null
}

export type SantuyMember = {
  profileId: string
  position: number
  active: boolean
}

export type SantuyData = {
  settings: SantuySettings & {
    meetUrl: string | null
    googleEventId: string | null
  }
  /** Ordered by position; inactive ones ("udah cabut") included. */
  members: SantuyMember[]
  weeks: (SantuyWeek & { note: string | null })[]
  /** Every profile by id (duplicates too), for names and avatars. */
  people: Map<string, SantuyPerson>
  /** One per person (deduped by email), for pickers. */
  pickable: SantuyPerson[]
}

export const DEFAULT_SETTINGS: SantuyData["settings"] = {
  weekday: 5,
  startTime: "16:00",
  durationMin: 60,
  timezone: "Asia/Jakarta",
  anchorDate: "2026-11-06",
  anchorIndex: 0,
  meetUrl: null,
  googleEventId: null,
}

async function fetchSantuy(): Promise<SantuyData> {
  const supabase = createClient()
  const [settings, members, weeks, profiles] = await Promise.all([
    supabase.from("santuy_settings").select("*").maybeSingle(),
    supabase
      .from("santuy_members")
      .select("profile_id, position, active")
      .order("position"),
    supabase
      .from("santuy_weeks")
      .select("date, kind, profile_id, note, moved_date, moved_time")
      .order("date"),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email, created_at")
      .not("full_name", "is", null)
      .order("full_name"),
  ])
  const error = settings.error || members.error || weeks.error || profiles.error
  if (error) throw error

  const row = settings.data
  const people = (profiles.data ?? []) as SantuyPerson[]
  return {
    settings: row
      ? {
          weekday: row.weekday,
          startTime: row.start_time.slice(0, 5),
          durationMin: row.duration_min,
          timezone: row.timezone,
          anchorDate: row.anchor_date,
          anchorIndex: row.anchor_index,
          meetUrl: row.meet_url,
          googleEventId: row.google_event_id,
        }
      : DEFAULT_SETTINGS,
    members: (
      (members.data ?? []) as {
        profile_id: string
        position: number
        active: boolean
      }[]
    ).map((m) => ({
      profileId: m.profile_id,
      position: m.position,
      active: m.active,
    })),
    weeks: (
      (weeks.data ?? []) as {
        date: string
        kind: string
        profile_id: string | null
        note: string | null
        moved_date: string | null
        moved_time: string | null
      }[]
    ).map((w) => ({
      date: w.date,
      kind:
        w.kind === "assign" ? "assign" : w.kind === "move" ? "move" : "skip",
      profileId: w.profile_id,
      movedDate: w.moved_date,
      movedTime: w.moved_time?.slice(0, 5) ?? null,
      note: w.note,
    })),
    people: new Map(people.map((p) => [p.id, p])),
    pickable: dedupeProfilesByEmail(people).sort((a, b) =>
      (a.full_name ?? "").localeCompare(b.full_name ?? ""),
    ),
  }
}

export function useSantuy(enabled = true) {
  // Live: a swap or a new presenter shows up for everyone at once.
  useRealtimeRefresh(
    "santuy",
    [
      { table: "santuy_weeks", keys: () => [santuyKey] },
      { table: "santuy_members", keys: () => [santuyKey] },
      { table: "santuy_settings", keys: () => [santuyKey] },
    ],
    enabled,
  )
  return useQuery({
    queryKey: santuyKey,
    queryFn: fetchSantuy,
    enabled,
    staleTime: 60_000,
  })
}

/** Active members' profile ids, in presenting order. */
export const activeQueue = (members: SantuyMember[]) =>
  members.filter((m) => m.active).map((m) => m.profileId)

/**
 * Save a queue edit (reorder / add / remove / restore) and optionally new
 * schedule settings, keeping the upcoming presenter where they are (see
 * `reanchor`): past sessions since the old anchor are frozen as 'assign'
 * rows first, then the queue, then the new anchor.
 *
 * `members` is the whole queue after the edit, in order (inactive ones too).
 */
export async function commitSantuy(
  data: SantuyData,
  members: SantuyMember[],
  schedule?: { weekday: number; startTime: string; durationMin: number },
) {
  const supabase = createClient()
  const { settings } = data
  const today = todayIn(settings.timezone)
  const next = reanchor({
    settings,
    queue: activeQueue(data.members),
    weeks: data.weeks,
    nextQueue: activeQueue(members),
    nextWeekday: schedule?.weekday,
    today,
  })

  const taken = new Set(data.weeks.map((w) => w.date))
  const freeze = next.freeze.filter((f) => !taken.has(f.date))
  if (freeze.length) {
    const { error } = await supabase.from("santuy_weeks").insert(
      freeze.map((f) => ({
        date: f.date,
        kind: "assign",
        profile_id: f.profileId,
        note: "history",
      })),
    )
    if (error) throw error
  }

  const changed = members
    .map((m, position) => ({ ...m, position }))
    .filter((m) => {
      const before = data.members.find((b) => b.profileId === m.profileId)
      return (
        !before || before.position !== m.position || before.active !== m.active
      )
    })
  if (changed.length) {
    const { error } = await supabase.from("santuy_members").upsert(
      changed.map((m) => ({
        profile_id: m.profileId,
        position: m.position,
        active: m.active,
      })),
    )
    if (error) throw error
  }

  const { error } = await supabase
    .from("santuy_settings")
    .update({
      anchor_date: next.anchorDate,
      anchor_index: next.anchorIndex,
      ...(schedule && {
        weekday: schedule.weekday,
        start_time: schedule.startTime,
        duration_min: schedule.durationMin,
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
  if (error) throw error
}

/** Set one week's exception ('skip' or 'assign'), or clear it (null). */
/** What a week can be set to (null: back to the rotation). */
export type SantuyWeekValue =
  | { kind: "skip"; note?: string | null }
  | { kind: "assign"; profileId: string }
  | {
      kind: "move"
      movedDate: string
      /** "HH:mm"; null keeps the usual start time. */
      movedTime: string | null
      note?: string | null
    }
  | null

/** Saving it tells the queue (santuy_weeks_notify trigger). */
export async function setSantuyWeek(date: string, value: SantuyWeekValue) {
  const supabase = createClient()
  const { error } = value
    ? await supabase.from("santuy_weeks").upsert({
        date,
        kind: value.kind,
        profile_id: value.kind === "assign" ? value.profileId : null,
        moved_date: value.kind === "move" ? value.movedDate : null,
        moved_time: value.kind === "move" ? value.movedTime : null,
        note: value.kind === "assign" ? null : value.note?.trim() || null,
      })
    : await supabase.from("santuy_weeks").delete().eq("date", date)
  if (error) throw error
}

/** The Meet link route (Google event or a pasted link). */
export async function santuyMeet(
  body:
    | { action: "google" }
    | { action: "manual"; url: string }
    | {
        action: "sync"
      },
) {
  const res = await fetch("/api/santuy/meet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as {
    error?: string
    meetUrl?: string | null
  }
  if (!res.ok) throw new Error(json.error ?? "failed")
  return json
}
