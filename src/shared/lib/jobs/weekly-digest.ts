import { createAdminClient } from "@/shared/api/supabase/admin"
import { mailConfigured, sendMail } from "@/shared/lib/mailer"
import { wantsEmail } from "@/shared/lib/notification-email"
import {
  emailWeeklyDigest,
  type EmailSection,
} from "@/shared/lib/notification-email-html"
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

const TZ = "Asia/Jakarta"
const firstName = (name: string | null | undefined) =>
  name?.trim().split(/\s+/)[0] || "Seseorang"
const day = (date: string, pattern = "EEE, d MMM") =>
  format(new Date(`${date}T12:00:00Z`), pattern, { locale: idLocale })

const NOTES = [
  "Selamat hari Senin! Ini yang perlu kamu tahu buat minggu ini.",
  "Pagi! Ngopi dulu, terus intip rencana minggu ini bareng-bareng.",
  "Minggu baru, semangat baru. Ini rangkumannya biar nggak ada yang kelewat.",
]

/**
 * Monday's weekly digest by email (Settings → Notifikasi → Ringkasan
 * mingguan): your tasks this week (and what's overdue), Sharing Santuy,
 * company holidays, and for stakeholders and PMs who's off. To everyone active (attendance in the last 30
 * days or in the Santuy queue). Once per person per week (email_digests).
 */
export async function runWeeklyDigest(
  now = new Date(),
  /** Testing: one person's digest, to another address, not marked sent. */
  preview?: { userId: string; to: string },
) {
  if (!mailConfigured()) return { sent: 0, skipped: "not configured" }
  const today = todayIn(TZ, now)
  if (weekdayOf(today) !== 1 && !preview)
    return { sent: 0, skipped: "not monday" }
  const weekStart = today
  const weekEnd = addDays(today, 6)
  const db = createAdminClient()

  const [recentLogs, queueRows, sent] = await Promise.all([
    db
      .from("attendance_logs")
      .select("user_id")
      .gte("date", addDays(today, -30)),
    db.from("santuy_members").select("profile_id").eq("active", true),
    db.from("email_digests").select("user_id").eq("week_start", weekStart),
  ])
  const done = new Set((sent.data ?? []).map((r) => r.user_id))
  const ids = [
    ...new Set([
      ...(recentLogs.data ?? []).map((r) => r.user_id as string),
      ...(queueRows.data ?? []).map((r) => r.profile_id as string),
    ]),
  ].filter((id) => (preview ? id === preview.userId : !done.has(id)))
  if (!ids.length) return { sent: 0 }

  const [people, prefs, tasks, leaves, holidays] = await Promise.all([
    db
      .from("profiles")
      .select("id, full_name, email, role, job_title")
      .in("id", ids),
    db
      .from("notification_email_prefs")
      .select("user_id, enabled, muted")
      .in("user_id", ids),
    db
      .from("project_tasks")
      .select("assignee_id, title, due_date, projects(name)")
      .in("assignee_id", ids)
      .eq("done", false)
      .not("due_date", "is", null)
      .lte("due_date", weekEnd)
      .order("due_date"),
    db
      .from("leave_requests")
      .select("user_id, start_date, end_date, leave_type, profiles(full_name)")
      .eq("status", "approved")
      .neq("leave_type", "WFH")
      .lte("start_date", weekEnd)
      .gte("end_date", weekStart)
      .order("start_date"),
    db
      .from("calendar_events")
      .select("title, start_at")
      .eq("event_type", "Company Holiday")
      .gte("start_at", `${addDays(weekStart, -1)}T17:00:00Z`)
      .lte("start_at", `${weekEnd}T17:00:00Z`)
      .order("start_at"),
  ])
  const prefsOf = new Map((prefs.data ?? []).map((p) => [p.user_id, p]))

  // Everyone's part of the email: who's off, holidays, Sharing Santuy.
  const offRows = (leaves.data ?? []).map((l) => {
    const who = (l.profiles as unknown as { full_name: string | null } | null)
      ?.full_name
    const range =
      l.start_date === l.end_date
        ? day(l.start_date)
        : `${day(l.start_date)} – ${day(l.end_date)}`
    return {
      primary: who ?? "Seseorang",
      secondary: `${l.leave_type === "Sick Leave" ? "Sakit" : "Cuti"} · ${range}`,
    }
  })
  const holidayRows = (holidays.data ?? []).map((h) => ({
    primary: h.title as string,
    secondary: day(todayIn(TZ, new Date(h.start_at as string)), "EEEE, d MMM"),
  }))
  const santuyRows = await santuyThisWeek(db, weekStart, weekEnd)

  let count = 0
  for (const person of people.data ?? []) {
    if (!person.email) continue
    if (!wantsEmail("weekly_digest", prefsOf.get(person.id))) continue
    const mine = (tasks.data ?? []).filter((t) => t.assignee_id === person.id)
    const taskRows = mine.slice(0, 8).map((t) => ({
      primary: t.title as string,
      secondary: `${(t.projects as unknown as { name: string } | null)?.name ?? "Project"} · ${
        (t.due_date as string) < today
          ? `lewat tenggat ${day(t.due_date as string, "d MMM")}`
          : `tenggat ${day(t.due_date as string)}`
      }`,
    }))
    if (mine.length > 8)
      taskRows.push({
        primary: `+${mine.length - 8} tugas lagi`,
        secondary: "",
      })

    const sections: EmailSection[] = [
      {
        title: "Tugas kamu",
        rows: taskRows,
        empty: "Nggak ada tenggat minggu ini. Santai, tapi tetap produktif ya!",
      },
      {
        title: "Sharing Santuy",
        rows: santuyRows,
        empty: "Belum ada jadwal minggu ini.",
      },
      // Who's off is for the people who plan around it.
      ...(person.role === "stakeholder" ||
      person.job_title === "Project Manager"
        ? [
            {
              title: "Yang cuti",
              rows: offRows,
              empty: "Semua masuk minggu ini.",
            },
          ]
        : []),
      ...(holidayRows.length
        ? [{ title: "Libur kantor", rows: holidayRows, empty: "" }]
        : []),
    ]
    const mail = emailWeeklyDigest({
      name: person.full_name ?? "",
      weekLabel: `${day(weekStart, "d MMM")} – ${day(weekEnd, "d MMM")}`,
      note: NOTES[
        (Number.parseInt(person.id.slice(0, 6), 16) || 0) % NOTES.length
      ],
      sections,
    })
    if (preview) {
      if (await sendMail(preview.to, `[Tes] ${mail.subject}`, mail.html))
        count++
      continue
    }
    // Claim first, so two runs never send it twice.
    const { error } = await db
      .from("email_digests")
      .insert({ user_id: person.id, week_start: weekStart })
    if (error) continue
    if (await sendMail(person.email, mail.subject, mail.html)) count++
  }
  return { sent: count }
}

/** This week's session (or that it's off), as digest rows. */
async function santuyThisWeek(
  db: ReturnType<typeof createAdminClient>,
  weekStart: string,
  weekEnd: string,
) {
  const [{ data: row }, { data: members }, { data: weekRows }] =
    await Promise.all([
      db.from("santuy_settings").select("*").maybeSingle(),
      db
        .from("santuy_members")
        .select("profile_id")
        .eq("active", true)
        .order("position"),
      db
        .from("santuy_weeks")
        .select("date, kind, profile_id, moved_date, moved_time"),
    ])
  if (!row) return []
  const settings: SantuySettings = {
    weekday: row.weekday,
    startTime: row.start_time,
    durationMin: row.duration_min,
    timezone: row.timezone,
    anchorDate: row.anchor_date,
    anchorIndex: row.anchor_index,
  }
  const weeks: SantuyWeek[] = (weekRows ?? []).map((w) => ({
    date: w.date,
    kind: w.kind,
    profileId: w.profile_id,
    movedDate: w.moved_date,
    movedTime: w.moved_time?.slice(0, 5) ?? null,
  }))
  const sessions = santuySchedule({
    settings,
    queue: (members ?? []).map((m) => m.profile_id as string),
    weeks,
    from: addDays(weekStart, -6),
    to: addDays(weekEnd, 6),
  }).filter((s) => {
    const d = s.movedTo ?? s.date
    return !s.history && d >= weekStart && d <= weekEnd
  })
  const ids = sessions.map((s) => s.profileId).filter(Boolean) as string[]
  const { data: people } = ids.length
    ? await db.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] }
  const nameOf = new Map((people ?? []).map((p) => [p.id, p.full_name]))
  return sessions.map((s) =>
    s.kind === "skip"
      ? { primary: "Libur minggu ini", secondary: day(s.date, "EEEE, d MMM") }
      : {
          primary: `${firstName(nameOf.get(s.profileId!))} yang sharing`,
          secondary: `${day(s.movedTo ?? s.date, "EEEE, d MMM")} · ${s.start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ })}`,
        },
  )
}
