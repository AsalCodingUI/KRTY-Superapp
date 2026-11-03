import { siteConfig } from "@/app/siteConfig"
import { friendlyLine } from "./notification-email-copy"

/**
 * How a notification reads in someone's inbox, Figma style: the person who
 * set it off as the sender ("Habibi via Kretya Flow"), one sentence as the
 * subject ("Habibi nyebut kamu di report Oakland"). The body follows
 * Figma's: where it happened, the headline, a primary button, then a card
 * with who and what and a second button. Values from the app's light
 * theme so it looks like Kretya Flow.
 */

const APP_NAME = "Kretya Flow"

/** Links and pictures open in someone's mail app, so never localhost. */
const BASE = /localhost|127\.0\.0\.1/.test(siteConfig.url)
  ? "https://app.kretyastudio.com"
  : siteConfig.url

export type EmailNotification = {
  /** Picks the friendly line, so a notice keeps the same one. */
  id?: string
  type: string
  title: string
  message: string
  link: string | null
}

export type EmailActor = {
  name: string
  avatarUrl?: string | null
} | null

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name
/** "Aracor · Side Task" → ["Aracor", "Side Task"]. */
const parts = (message: string) =>
  message
    .split(" · ")
    .map((p) => p.trim())
    .filter(Boolean)
const sentence = (s: string) => s.trim().replace(/[.。]+$/, "")

/** A task comment's notification: "Task title · the comment". */
export function commentOf(n: EmailNotification) {
  const at = n.message.indexOf(" · ")
  return at < 0
    ? { task: "tugas", body: n.message }
    : { task: n.message.slice(0, at), body: n.message.slice(at + 3) }
}

/** Display name in the From line (the address stays NOTIFY_EMAIL_FROM's). */
export function emailFromName(actor: EmailActor) {
  return actor ? `${firstName(actor.name)} via ${APP_NAME}` : APP_NAME
}

/** One sentence, who first when we know who. */
export function emailSubject(n: EmailNotification, actor: EmailActor) {
  const a = actor ? firstName(actor.name) : null
  const [first, second] = parts(n.message)
  switch (n.type) {
    case "task_comment":
      return `${a ?? "Seseorang"} komentar di ${commentOf(n).task}`
    case "mention":
      return n.title
    case "task_assigned":
      return a
        ? `${a} ngasih kamu tugas${second ? ` di ${second}` : ""}`
        : `Tugas baru${second ? ` di ${second}` : ""}`
    case "task_due":
      // "Tenggat besok", "Tenggat hari ini", "Lewat tenggat".
      return `${n.title}: ${first ?? "tugas"}`
    case "task_status":
    case "attendance_reminder":
    case "brief_submitted":
    case "brief_offer":
      return n.title
    case "invoice_due":
    case "invoice_paid":
      return first ? `${n.title} · ${first}` : n.title
    case "project_assignment":
      return a
        ? `${a} nambahin kamu ke ${first ?? "project"}`
        : `Kamu ditambahkan ke ${first ?? "project"}`
    case "project_lead":
      return a
        ? `${a} jadiin kamu lead ${first ?? "project"}`
        : `Kamu jadi lead ${first ?? "project"}`
    case "leave_request":
    case "leave_status":
      return sentence(first ?? n.title)
    case "one_on_one":
      // "Taufiq memilih slot 1:1", "1:1 dengan Habibi", "Slot 1:1 baru".
      return first?.startsWith("Slot 1:1 baru")
        ? n.title
        : sentence(first ?? n.title)
    case "attendance_decision":
      return a ? `${a}: ${n.title.toLowerCase()}` : n.title
    case "review_cycle": {
      const period = n.message.match(/\d{4}-Q\d/)?.[0]
      return `Review 360${period ? ` ${period}` : ""} udah dibuka`
    }
    case "calendar_event":
      return a
        ? `${a} nambahin jadwal: ${first ?? n.title}`
        : `Jadwal baru: ${first ?? n.title}`
    case "kpi_scored":
      return first ? `${n.title} · ${first}` : n.title
    case "announcement_urgent":
      return `Pengumuman: ${n.title}`
    default:
      return n.title
  }
}

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  )

// The app's light theme, as plain values (email clients don't do CSS
// variables): globals.css tokens and the Button / Card components.
const C = {
  page: "#ffffff",
  fg: "#2b2b2b",
  muted: "#4e4e4e",
  tertiary: "#8a8a8a",
  surface: "#f7f7f7",
  line: "#ececec",
  field: "#e4e4e4",
  primary: "#048af5",
}
const FONT =
  "Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const iconUrl = () => new URL("/icons/mark-light-96.png", BASE).toString()

/** Where it happened, above the headline (the project when we know it). */
function contextLabel(n: EmailNotification) {
  const [first, second] = parts(n.message)
  switch (n.type) {
    case "task_comment":
      return commentOf(n).task
    case "task_assigned":
      return second ?? "Tugas"
    case "task_due":
    case "task_status":
      return parts(n.message)[1] ?? "Tugas"
    case "invoice_due":
    case "invoice_paid":
      return parts(n.message)[1] ?? "Invoice"
    case "attendance_reminder":
      return "Cuti & Kehadiran"
    case "project_assignment":
    case "project_lead":
      return first ?? "Project"
    case "kpi_scored":
      return first ?? "Kinerja"
    case "mention":
      return n.title.match(/ report (.+)$/)?.[1] ?? "Report"
    case "leave_request":
    case "leave_status":
    case "attendance_decision":
      return "Cuti & Kehadiran"
    case "calendar_event":
    case "one_on_one":
      return "Kalender"
    case "review_cycle":
    case "review_summary":
      return "Kinerja"
    case "announcement_urgent":
      return "Pengumuman"
    case "santuy_presenter":
    case "santuy_today":
    case "santuy_change":
      return "Sharing Santuy"
    default:
      return APP_NAME
  }
}

/** Avatar like the app's: the photo, else the initial on muted. */
function avatar(actor: EmailActor) {
  const box =
    "width:32px;height:32px;border-radius:999px;display:block;object-fit:cover"
  if (actor?.avatarUrl?.startsWith("https://"))
    return `<img src="${escape(actor.avatarUrl)}" width="32" height="32" alt="" style="${box}">`
  if (actor)
    return `<div style="${box};background:${C.surface};border:1px solid ${C.line};box-sizing:border-box;color:${C.muted};font-family:${FONT};font-size:13px;line-height:30px;font-weight:500;text-align:center">${escape(firstName(actor.name).charAt(0).toUpperCase())}</div>`
  return `<img src="${escape(iconUrl())}" width="32" height="32" alt="" style="${box};border-radius:0">`
}

/** Button (components/ui/button): the primary pill, full width. */
function button(href: string, label: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="border-radius:999px;background:${C.primary}"><a href="${escape(href)}" target="_blank" style="display:block;padding:13px 20px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:500;letter-spacing:-0.006em;color:#ffffff;text-align:center;text-decoration:none;border-radius:999px">${escape(label)}</a></td></tr></table>`
}

/**
 * Type like the app's (Geist): headlines tight (-0.025em, as h1), names a
 * touch tight, small print a touch open so it stays legible; body copy at
 * the app's 450 weight.
 */
const tracking = (size: number) =>
  size >= 18 ? "-0.025em" : size >= 14 ? "-0.006em" : "0.005em"
const text = (size: number, line: number, color: string, weight = 450) =>
  `font-family:${FONT};font-size:${size}px;line-height:${line}px;font-weight:${weight};letter-spacing:${tracking(size)};color:${color};margin:0`

type Entry = { actor: EmailActor; text: string }

/** One line in the card: avatar, name, what they said. The same person
 *  again right after is just the text, under the first (like a chat). */
function entryRow({ actor, text: body }: Entry, prev: Entry | undefined) {
  const same = Boolean(prev && actor && prev.actor?.name === actor.name)
  const lead = actor
    ? `<td width="32" valign="top" style="width:32px;padding-right:14px">${same ? "" : avatar(actor)}</td>`
    : ""
  return `<tr><td style="padding-top:${prev ? (same ? 10 : 24) : 0}px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
${lead}
<td valign="top">
${actor && !same ? `<p style="${text(14, 20, C.fg, 500)};padding-bottom:4px">${escape(actor.name)}</p>` : ""}
<p style="${text(14, 21, C.muted)}">${escape(body)}</p>
</td></tr></table></td></tr>`
}

/**
 * Laid out like Figma's comment emails, trimmed down: the mark, where it
 * happened, the headline, who said what, one button, one line of footer.
 */
/** A titled list in an outlined card (the weekly digest's parts). */
export type EmailSection = {
  title: string
  rows: { primary: string; secondary?: string }[]
  /** Shown when there are no rows. */
  empty: string
}

function sectionHtml({ title, rows, empty }: EmailSection) {
  const body = rows.length
    ? rows
        .map(
          (r, i) =>
            `<tr><td style="padding-top:${i ? 14 : 0}px"><p style="${text(14, 20, C.fg, 500)}">${escape(r.primary)}</p>${r.secondary ? `<p style="${text(13, 19, C.tertiary)};padding-top:2px">${escape(r.secondary)}</p>` : ""}</td></tr>`,
        )
        .join("")
    : `<tr><td><p style="${text(14, 21, C.muted)}">${escape(empty)}</p></td></tr>`
  return `<tr><td style="padding-top:28px">
<p style="${text(13, 18, C.tertiary)};padding:0 4px 10px">${escape(title)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px"><tr><td style="padding:20px 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>
</td></tr></table>
</td></tr>`
}

function layout({
  context,
  headline,
  note,
  entries,
  sections = [],
  href,
}: {
  context: string
  headline: string
  /** A friendly line under the headline. */
  note?: string | null
  entries: Entry[]
  sections?: EmailSection[]
  href: string
}) {
  const settings = new URL("/dashboard?settings=notifications", BASE).toString()
  const card = entries.length
    ? `<tr><td style="padding-top:28px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:14px"><tr><td style="padding:24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${entries.map((e, i) => entryRow(e, entries[i - 1])).join("")}</table>
</td></tr></table>
</td></tr>`
    : ""

  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escape(headline)}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400..600&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${C.page}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escape(entries[0]?.text || note || headline)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:40px 20px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px">

<tr><td align="left" style="padding-bottom:36px"><img src="${escape(iconUrl())}" width="24" height="24" alt="${APP_NAME}" style="display:block;width:24px;height:24px"></td></tr>

<tr><td align="left"><p style="${text(13, 18, C.tertiary)}">${escape(context)}</p></td></tr>
<tr><td align="left" style="padding-top:6px"><p style="${text(20, 28, C.fg, 500)}">${escape(headline)}</p></td></tr>

${note ? `<tr><td align="left" style="padding-top:10px"><p style="${text(15, 23, C.muted)}">${escape(note)}</p></td></tr>` : ""}
${card}
${sections.map(sectionHtml).join("\n")}

<tr><td style="padding-top:28px">${button(href, `Buka di ${APP_NAME}`)}</td></tr>

<tr><td align="center" style="padding-top:48px"><p style="${text(12, 18, C.tertiary)};text-align:center">${APP_NAME} · Kretya Studio · <a href="${escape(settings)}" target="_blank" style="color:${C.tertiary};text-decoration:underline">Atur notifikasi email</a></p></td></tr>

</table>
</td></tr></table>
</body></html>`
}

export function emailHtml(n: EmailNotification, actor: EmailActor = null) {
  const subject = emailSubject(n, actor)
  // The card only when there's something the headline doesn't already say.
  const extra =
    n.message && sentence(n.message) !== sentence(subject) ? n.message : ""
  return layout({
    context: contextLabel(n),
    headline: subject,
    note: friendlyLine(n),
    entries: extra ? [{ actor, text: extra }] : [],
    href: new URL(n.link || "/", BASE).toString(),
  })
}

/**
 * New comments on one task, in one email (like Figma's "2 new comments
 * from …"): each comment with its author, oldest first. The subject stays
 * the same for the task, so mail apps keep them in one thread.
 */
export function emailCommentThread(
  comments: { n: EmailNotification; actor: EmailActor }[],
) {
  const first = comments[0]
  const { task } = commentOf(first.n)
  const names = [
    ...new Set(comments.map((c) => (c.actor ? firstName(c.actor.name) : ""))),
  ]
  const one = names.length === 1 && names[0] ? names[0] : null
  const headline =
    comments.length === 1
      ? `Komentar baru dari ${one ?? "tim"}`
      : one
        ? `${comments.length} komentar baru dari ${one}`
        : `${comments.length} komentar baru`
  return {
    subject: `Komentar di ${task}`,
    fromName: emailFromName(one ? first.actor : null),
    html: layout({
      context: task,
      headline,
      entries: comments.map((c) => ({
        actor: c.actor,
        text: commentOf(c.n).body,
      })),
      href: new URL(first.n.link || "/", BASE).toString(),
    }),
  }
}

/** Monday's "your week" email: tasks, who's off, Sharing Santuy, holidays. */
export function emailWeeklyDigest({
  name,
  weekLabel,
  note,
  sections,
}: {
  name: string
  /** "3–9 Nov". */
  weekLabel: string
  note: string
  sections: EmailSection[]
}) {
  const headline = `Minggu ini buat kamu, ${firstName(name)}`
  return {
    subject: `Rangkuman minggu ini · ${weekLabel}`,
    html: layout({
      context: `Ringkasan mingguan · ${weekLabel}`,
      headline,
      note,
      entries: [],
      sections,
      href: new URL("/dashboard", BASE).toString(),
    }),
  }
}
