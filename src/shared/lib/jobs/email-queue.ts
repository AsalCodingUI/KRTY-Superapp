import { createAdminClient } from "@/shared/api/supabase/admin"
import { wantsEmail } from "@/shared/lib/notification-email"
import {
  emailCommentThread,
  emailFromName,
  emailHtml,
  emailSubject,
  type EmailActor,
} from "@/shared/lib/notification-email-html"
import { createHash } from "crypto"
import { mailConfigured, sendMail } from "@/shared/lib/mailer"

/** Only notifications this fresh go out (older ones were seen in the app). */
const WINDOW_MINUTES = 15
const BATCH = 50

/**
 * Mails fresh notifications to the people who want them (Settings →
 * Notifikasi). Runs every minute in the server (lib/jobs/runner.ts).
 * Each notification is claimed (emailed_at) before it's sent, so two runs
 * never mail the same one. Does nothing until the mail service is set up.
 */
export async function runEmailQueue(): Promise<{
  sent: number
  failed?: number
  skipped?: string
}> {
  if (!mailConfigured()) return { sent: 0, skipped: "not configured" }

  const db = createAdminClient()
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString()
  const { data: queued, error } = await db
    .from("notifications")
    .select("id")
    .is("emailed_at", null)
    .gte("created_at", since)
    .order("created_at")
    .limit(BATCH)
  if (error) throw error
  if (!queued?.length) return { sent: 0 }

  // Claim them: only rows still unclaimed come back.
  const { data: claimed } = await db
    .from("notifications")
    .update({ emailed_at: new Date().toISOString() })
    .in(
      "id",
      queued.map((n) => n.id),
    )
    .is("emailed_at", null)
    .select("id, user_id, actor_id, title, message, type, link, created_at")
  if (!claimed?.length) return { sent: 0 }

  const userIds = [...new Set(claimed.map((n) => n.user_id))]
  const peopleIds = [
    ...new Set([...userIds, ...claimed.map((n) => n.actor_id).filter(Boolean)]),
  ]
  const [{ data: people }, { data: prefs }] = await Promise.all([
    db
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .in("id", peopleIds),
    db
      .from("notification_email_prefs")
      .select("user_id, enabled, muted")
      .in("user_id", userIds),
  ])
  const personOf = new Map((people ?? []).map((p) => [p.id, p]))
  const prefsOf = new Map((prefs ?? []).map((p) => [p.user_id, p]))

  type Row = (typeof claimed)[number]
  // Who set it off (not when it's your own doing, e.g. a reminder).
  const actorOf = (n: Row): EmailActor => {
    const who =
      n.actor_id && n.actor_id !== n.user_id ? personOf.get(n.actor_id) : null
    return who?.full_name
      ? { name: who.full_name, avatarUrl: who.avatar_url }
      : null
  }

  // Comments on one task go out together, one email per person and task.
  const threads = new Map<string, Row[]>()
  const singles: Row[] = []
  // Oldest first, so a thread reads in order.
  claimed.sort((a, b) => a.created_at.localeCompare(b.created_at))
  for (const n of claimed) {
    if (!personOf.get(n.user_id)?.email) continue
    if (!wantsEmail(n.type, prefsOf.get(n.user_id))) continue
    if (n.type === "task_comment") {
      const key = `${n.user_id}|${n.link ?? ""}`
      threads.set(key, [...(threads.get(key) ?? []), n])
    } else singles.push(n)
  }

  let sent = 0
  // A send that fails (the mail server busy, a rate limit) gives its claim
  // back, so the next run tries again while it's still fresh.
  const failed: string[] = []
  for (const n of singles) {
    const actor = actorOf(n)
    const ok = await sendMail(
      personOf.get(n.user_id)!.email!,
      emailSubject(n, actor),
      emailHtml(n, actor),
      emailFromName(actor),
    )
    if (ok) sent++
    else failed.push(n.id)
  }
  for (const rows of threads.values()) {
    const mail = emailCommentThread(rows.map((n) => ({ n, actor: actorOf(n) })))
    const thread = `task-${createHash("sha1")
      .update(rows[0].link ?? "")
      .digest("hex")
      .slice(0, 16)}`
    const ok = await sendMail(
      personOf.get(rows[0].user_id)!.email!,
      mail.subject,
      mail.html,
      mail.fromName,
      thread,
    )
    if (ok) sent++
    else failed.push(...rows.map((n) => n.id))
  }
  if (failed.length)
    await db.from("notifications").update({ emailed_at: null }).in("id", failed)
  return { sent, ...(failed.length ? { failed: failed.length } : {}) }
}
