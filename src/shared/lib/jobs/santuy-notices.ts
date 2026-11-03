import { createAdminClient } from "@/shared/api/supabase/admin"
import {
  addDays,
  santuySchedule,
  todayIn,
  weekdayOf,
  type SantuySettings,
  type SantuyWeek,
} from "@/shared/lib/santuy"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

const LINK = "/calendar/santuy"
const firstName = (name: string | null | undefined) =>
  name?.trim().split(/\s+/)[0] || "Seseorang"

/**
 * Sharing Santuy's scheduled notices, from 09:00 WIB each day (the server's
 * job runner, lib/jobs/runner.ts):
 * - Monday: the week's presenter hears it's their turn (and when).
 * - The day itself: the whole active queue hears who's sharing, and when.
 * Moved weeks count on the day they moved to; weeks off send nothing.
 * Each notice goes out once (santuy_notices).
 */
export async function runSantuyNotices(): Promise<{
  sent: number
  today?: string
}> {
  const db = createAdminClient()
  const [{ data: row }, { data: members }, { data: weekRows }] =
    await Promise.all([
      db.from("santuy_settings").select("*").maybeSingle(),
      db
        .from("santuy_members")
        .select("profile_id, position")
        .eq("active", true)
        .order("position"),
      db
        .from("santuy_weeks")
        .select("date, kind, profile_id, moved_date, moved_time"),
    ])
  if (!row) return { sent: 0 }

  const settings: SantuySettings = {
    weekday: row.weekday,
    startTime: row.start_time,
    durationMin: row.duration_min,
    timezone: row.timezone,
    anchorDate: row.anchor_date,
    anchorIndex: row.anchor_index,
  }
  const queue = (members ?? []).map((m) => m.profile_id as string)
  const weeks: SantuyWeek[] = (weekRows ?? []).map((w) => ({
    date: w.date,
    kind: w.kind,
    profileId: w.profile_id,
    movedDate: w.moved_date,
    movedTime: w.moved_time?.slice(0, 5) ?? null,
  }))
  const today = todayIn(settings.timezone)
  // A moved week can land up to six days either side of its usual day.
  const sessions = santuySchedule({
    settings,
    queue,
    weeks,
    from: addDays(today, -7),
    to: addDays(today, 14),
  }).filter((s) => s.kind === "session" && !s.history && s.profileId)

  const { data: people } = await db
    .from("profiles")
    .select("id, full_name")
    .in("id", [...new Set([...queue, ...sessions.map((s) => s.profileId!)])])
  const nameOf = new Map((people ?? []).map((p) => [p.id, p.full_name]))

  const hhmm = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: settings.timezone,
    })
  const dayLabel = (date: string) =>
    format(new Date(`${date}T12:00:00Z`), "EEEE, d MMM", { locale: idLocale })

  /** Claims a notice; false when it already went out. */
  const claim = async (date: string, kind: "presenter_week" | "day_of") => {
    const { error } = await db.from("santuy_notices").insert({ date, kind })
    return !error
  }

  let sent = 0
  const isMonday = weekdayOf(today) === 1
  for (const s of sessions) {
    const day = s.movedTo ?? s.date
    const when = `${dayLabel(day)} · ${hhmm(s.start)}`

    if (isMonday && day >= today && day <= addDays(today, 6)) {
      if (await claim(s.date, "presenter_week")) {
        await db.from("notifications").insert({
          user_id: s.profileId,
          title: "Minggu ini giliran kamu Sharing Santuy",
          message: when,
          type: "santuy_presenter",
          link: LINK,
        })
        sent++
      }
    }

    if (day === today && queue.length && (await claim(s.date, "day_of"))) {
      const presenter = firstName(nameOf.get(s.profileId!))
      const time = hhmm(s.start)
      await db.from("notifications").insert(
        queue.map((id) =>
          id === s.profileId
            ? {
                user_id: id,
                title: "Hari ini kamu yang sharing",
                message: `Sharing Santuy jam ${time}`,
                type: "santuy_today",
                link: LINK,
              }
            : {
                user_id: id,
                title: `Hari ini Sharing Santuy bareng ${presenter}`,
                message: `Jam ${time}`,
                type: "santuy_today",
                link: LINK,
              },
        ),
      )
      sent += queue.length
    }
  }
  return { sent, today }
}
