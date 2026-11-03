import { timingSafeEqual } from "crypto"
import type { NextRequest } from "next/server"

/**
 * Jobs pg_cron calls (notification email, Sharing Santuy notices) send
 * "Authorization: Bearer <NOTIFY_CRON_SECRET>" (the same value sits in the
 * database vault as 'notify_cron_secret').
 */
export function cronAuthorized(request: NextRequest) {
  const secret = process.env.NOTIFY_CRON_SECRET
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "")
  if (!secret || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}
