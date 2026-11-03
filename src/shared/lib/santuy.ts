/**
 * Sharing Santuy rotation: one person presents each week, in queue order,
 * and the queue loops forever. Nothing per week is stored except exceptions;
 * this file turns settings + queue + exceptions into the schedule. Pure (no
 * clock, no I/O) so it's unit-tested (santuy.test.ts).
 *
 * Rules
 * - Session days: the first `weekday` on/after `anchorDate`, then every 7
 *   days. Before that day there are no computed sessions.
 * - Rotation: the session on the anchor day is presented by the active queue
 *   member at `anchorIndex`; every following session takes the next one,
 *   wrapping back to the start (loops forever).
 * - Skip (libur): that week has no session and shifts nobody: the person who
 *   would have presented takes the next session instead.
 * - Assign: that week's presenter is the assigned person, and nobody shifts:
 *   the rotation still uses that week's turn, so everyone else keeps their
 *   date (the person whose turn it was simply sits out this round). Simple
 *   and predictable: no "not twice in a row" adjustments.
 * - Move (digeser): that week's session happens on another day (and maybe
 *   another time). It still uses that week's turn, so nobody shifts; the
 *   presenter is the rotation's, or the assigned person if one was set.
 * - Exceptions on a day that isn't a session day are ignored.
 * - History: before the anchor only 'assign' rows exist as sessions. When the
 *   queue or the weekday changes, `reanchor` moves the anchor to the next
 *   session and freezes the past sessions since the old anchor as 'assign'
 *   rows, so history doesn't change when the queue does.
 * - Queue edits (reorder / add / remove) keep the upcoming presenter: the
 *   anchor moves to the next session with the rotation's current person
 *   (or, if they were removed, the next remaining person after them).
 *
 * Dates are "yyyy-MM-dd" calendar days in the session's time zone; the math
 * below runs in UTC so the machine's own zone never shifts a day.
 */

export type SantuySettings = {
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number
  /** "HH:mm" (or "HH:mm:ss" as Postgres returns it), wall time in `timezone`. */
  startTime: string
  durationMin: number
  timezone: string
  /** A day on/after which the first session falls. */
  anchorDate: string
  /** Index into the active queue presenting at the first session. */
  anchorIndex: number
}

export type SantuyWeek = {
  date: string
  kind: "skip" | "assign" | "move"
  profileId: string | null
  /** For "move": the day it happens instead ("yyyy-MM-dd"). */
  movedDate?: string | null
  /** For "move": its start time ("HH:mm"); null keeps the usual one. */
  movedTime?: string | null
}

export type SantuySession = {
  date: string
  /** "skip": a libur week (no session, listed so it can be shown). */
  kind: "session" | "skip"
  /** Who presents (null for a skip). */
  profileId: string | null
  /** Whose turn the rotation gives this week (null before the anchor). */
  rotationProfileId: string | null
  /** Set by an 'assign' exception (incl. frozen history). */
  assigned: boolean
  /** Before the anchor: a frozen past session. */
  history: boolean
  /** Moved to another day: the day it actually happens (`date` stays the
   *  week's usual day, which keys the exception). */
  movedTo: string | null
  start: Date
  end: Date
}

const DAY_MS = 86_400_000

/** UTC offsets of the zones we use (none of them has DST). */
const ZONE_OFFSETS: Record<string, string> = {
  "Asia/Jakarta": "+07:00",
  "Asia/Pontianak": "+07:00",
  "Asia/Makassar": "+08:00",
  "Asia/Jayapura": "+09:00",
  UTC: "+00:00",
}

export function zoneOffset(timezone: string) {
  return ZONE_OFFSETS[timezone] ?? "+07:00"
}

const toUtc = (date: string) => Date.parse(`${date}T00:00:00Z`)
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10)

export function addDays(date: string, days: number) {
  return fromUtc(toUtc(date) + days * DAY_MS)
}

export function weekdayOf(date: string) {
  return new Date(toUtc(date)).getUTCDay()
}

/** The first `weekday` on/after `date`. */
export function nextWeekday(date: string, weekday: number) {
  return addDays(date, (weekday - weekdayOf(date) + 7) % 7)
}

/** Today's date in a zone, as "yyyy-MM-dd". */
export function todayIn(timezone: string, now = new Date()) {
  const offset = zoneOffset(timezone)
  const sign = offset.startsWith("-") ? -1 : 1
  const [h, m] = offset.slice(1).split(":").map(Number)
  return fromUtc(now.getTime() + sign * (h * 60 + m) * 60_000)
}

/** A session's start and end instants. */
export function sessionTimes(date: string, settings: SantuySettings) {
  const time = settings.startTime.slice(0, 5)
  const start = new Date(`${date}T${time}:00${zoneOffset(settings.timezone)}`)
  const end = new Date(start.getTime() + settings.durationMin * 60_000)
  return { start, end }
}

/**
 * The schedule from `from` to `to` (inclusive): sessions and skip weeks,
 * oldest first. `queue` is the active members' profile ids in order.
 */
export function santuySchedule({
  settings,
  queue,
  weeks,
  from,
  to,
}: {
  settings: SantuySettings
  queue: string[]
  weeks: SantuyWeek[]
  from: string
  to: string
}): SantuySession[] {
  const byDate = new Map(weeks.map((w) => [w.date, w]))
  const first = nextWeekday(settings.anchorDate, settings.weekday)
  const out: SantuySession[] = []

  // Frozen history: assigned weeks before the rotation starts.
  for (const w of [...weeks].sort((a, b) => a.date.localeCompare(b.date))) {
    if (w.date >= first || w.date < from || w.date > to) continue
    if (w.kind !== "assign" || !w.profileId) continue
    out.push({
      date: w.date,
      kind: "session",
      profileId: w.profileId,
      rotationProfileId: null,
      assigned: true,
      history: true,
      movedTo: null,
      ...sessionTimes(w.date, settings),
    })
  }

  let turn = settings.anchorIndex
  for (let date = first; date <= to; date = addDays(date, 7)) {
    const week = byDate.get(date)
    const rotation = queue.length ? queue[turn % queue.length] : null
    const times = sessionTimes(date, settings)
    const inRange = date >= from

    if (week?.kind === "skip") {
      // Nobody shifts: the same turn moves to the next session.
      if (inRange)
        out.push({
          date,
          kind: "skip",
          profileId: null,
          rotationProfileId: rotation,
          assigned: false,
          history: false,
          movedTo: null,
          ...times,
        })
      continue
    }

    const moved = week?.kind === "move" && week.movedDate ? week : null
    const assigned = (week?.kind === "assign" || !!moved) && !!week?.profileId
    // The turn is used either way, so an assign shifts nobody else.
    if (rotation) turn += 1
    const presenter = assigned ? week!.profileId : rotation
    if (inRange && presenter)
      out.push({
        date,
        kind: "session",
        profileId: presenter,
        rotationProfileId: rotation,
        assigned,
        history: false,
        movedTo: moved?.movedDate ?? null,
        ...(moved
          ? sessionTimes(moved.movedDate!, {
              ...settings,
              startTime: moved.movedTime || settings.startTime,
            })
          : times),
      })
  }
  return out
}

/** The next session (not a skip) on/after `today`, if any. */
export function nextSession(
  args: Omit<Parameters<typeof santuySchedule>[0], "from" | "to">,
  today: string,
) {
  // Every skip row could push it a week further; one full loop + slack.
  const horizon = 7 * (args.queue.length + args.weeks.length + 2)
  return santuySchedule({ ...args, from: today, to: addDays(today, horizon) })
    .filter((s) => s.kind === "session" && !s.history)
    .at(0)
}

/**
 * Where the rotation continues after an edit, so the upcoming presenter
 * stays put:
 * - the new anchor is the next session (or, when the weekday changes, the
 *   first new weekday on/after today);
 * - the person there is whoever the old rotation gave that session; if they
 *   left the queue, the next one after them (old order) who's still in;
 * - past sessions since the old anchor (before today) are returned as
 *   `freeze`: save them as 'assign' rows so history keeps its presenters.
 */
export function reanchor({
  settings,
  queue,
  weeks,
  nextQueue,
  nextWeekday: newWeekday = settings.weekday,
  today,
}: {
  settings: SantuySettings
  queue: string[]
  weeks: SantuyWeek[]
  /** The active queue after the edit. */
  nextQueue: string[]
  /** The weekday after the edit (defaults to the current one). */
  nextWeekday?: number
  today: string
}): {
  anchorDate: string
  anchorIndex: number
  freeze: { date: string; profileId: string }[]
} {
  const upcoming = nextSession({ settings, queue, weeks }, today)
  const sameDay = newWeekday === settings.weekday
  const anchorDate =
    sameDay && upcoming ? upcoming.date : nextWeekday(today, newWeekday)

  let anchorIndex = 0
  const current = upcoming?.rotationProfileId
  if (current && nextQueue.length) {
    const from = queue.indexOf(current)
    for (let i = 0; i < queue.length; i++) {
      const at = nextQueue.indexOf(queue[(from + i) % queue.length])
      if (at >= 0) {
        anchorIndex = at
        break
      }
    }
  }

  const first = nextWeekday(settings.anchorDate, settings.weekday)
  const freeze = santuySchedule({
    settings,
    queue,
    weeks,
    from: first,
    to: addDays(today, -1),
  })
    .filter((s) => s.kind === "session" && !s.assigned && s.date < anchorDate)
    .map((s) => ({ date: s.date, profileId: s.profileId! }))

  return { anchorDate, anchorIndex, freeze }
}
