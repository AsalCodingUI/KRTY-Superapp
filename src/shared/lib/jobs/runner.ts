import { todayIn } from "@/shared/lib/santuy"
import { runEmailQueue } from "./email-queue"
import { runSantuyNotices } from "./santuy-notices"
import { runWeeklyDigest } from "./weekly-digest"

/**
 * The server's own clock for notices that need the app (email, Sharing
 * Santuy's schedule, Monday's digest). Ticks every minute; each job is safe
 * to run again (claims in the database), so a restart or a slow tick never
 * double-sends. Started from instrumentation.ts only where JOBS_ENABLED=1,
 * which only the production app sets: dev and staging share the database
 * and must not send.
 */
const TICK_MS = 60_000
let started = false

function wibHour(now: Date) {
  return Number(
    now.toLocaleString("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }),
  )
}

async function tick() {
  const now = new Date()
  const hour = wibHour(now)
  const run = async (name: string, job: () => Promise<unknown>) => {
    try {
      await job()
    } catch (error) {
      console.error(`[jobs] ${name} failed`, (error as Error).message)
    }
  }
  await run("email", runEmailQueue)
  // Santuy: from 09:00 WIB (claims make the later ticks no-ops).
  if (hour >= 9) await run("santuy", runSantuyNotices)
  // Digest: Monday from 08:00 WIB.
  if (hour >= 8) await run("digest", () => runWeeklyDigest(now))
}

export function startJobs() {
  if (started) return
  started = true
  console.log(`[jobs] started (${todayIn("Asia/Jakarta")})`)
  setInterval(() => void tick(), TICK_MS)
  void tick()
}
