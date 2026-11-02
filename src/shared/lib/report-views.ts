import { createAdminClient } from "@/shared/api/supabase/admin"
import { createClient } from "@/shared/api/supabase/server"
import { cookies, headers } from "next/headers"
import { createHmac } from "node:crypto"

/*
 * Read tracking for shared reports ("kapan klien buka link report-nya").
 * Server only: a visit is written with the service key after leaving out
 *  - the team (a signed-in Supabase session in this browser),
 *  - bots and link-preview fetchers (WhatsApp, Slack, curl, …), and
 *  - the same visitor again within 30 minutes (a salted hash of IP + user
 *    agent; the IP itself is never stored).
 */

export type ReportViewSource = "link" | "portal"

const DEDUPE_MS = 30 * 60_000

/** Crawlers, link unfurlers and HTTP tools: never a client reading. */
const BOT_UA =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|telegrambot|slack|discordbot|twitterbot|linkedinbot|skypeuripreview|embedly|pinterest|vkshare|redditbot|applebot|google(?:bot|other|-)|-google|bingpreview|yandex|baidu|duckduck|ia_archiver|preview|curl|wget|httpie|python|aiohttp|httpx|go-http-client|okhttp|java\/|libwww|node-fetch|axios|undici|headless|phantom|puppeteer|playwright|lighthouse|pagespeed|gtmetrix|postman|insomnia|scrapy|zgrab|masscan|uptime|pingdom/i

export function isBotUserAgent(ua: string) {
  return !ua.trim() || !/^Mozilla\//.test(ua) || BOT_UA.test(ua)
}

/** "mobile" | "tablet" | "desktop" from a user agent. */
export function deviceOf(ua: string) {
  if (/iPad|Tablet|PlayBook|Silk|Android(?!.*Mobi)/i.test(ua)) return "tablet"
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return "mobile"
  // iPadOS asks for desktop sites ("Macintosh"); the touch hint is lost here.
  return "desktop"
}

/** A short label like "iPhone · Safari" (never the whole string). */
export function uaLabel(ua: string) {
  const os = /iPhone|iPod/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /CrOS/.test(ua)
            ? "ChromeOS"
            : /Mac OS X|Macintosh/.test(ua)
              ? "Mac"
              : /Linux/.test(ua)
                ? "Linux"
                : null
  const browser = /Instagram/.test(ua)
    ? "Instagram"
    : /FBAN|FBAV/.test(ua)
      ? "Facebook"
      : /Line\//.test(ua)
        ? "LINE"
        : /Edg(?:e|A|iOS)?\//.test(ua)
          ? "Edge"
          : /OPR\/|Opera/.test(ua)
            ? "Opera"
            : /SamsungBrowser/.test(ua)
              ? "Samsung Internet"
              : /Firefox|FxiOS/.test(ua)
                ? "Firefox"
                : /Chrome|CriOS/.test(ua)
                  ? "Chrome"
                  : /Safari/.test(ua)
                    ? "Safari"
                    : null
  return [os, browser].filter(Boolean).join(" · ").slice(0, 60) || null
}

function visitorHash(ip: string, ua: string) {
  const salt =
    process.env.REPORT_VIEW_SALT || process.env.SUPABASE_SERVICE_KEY || ""
  return createHmac("sha256", `report-views:${salt}`)
    .update(`${ip}\n${ua}`)
    .digest("hex")
    .slice(0, 32)
}

/** A team member's browser: it carries a Supabase session that checks out. */
async function isTeamSession() {
  const jar = await cookies()
  // Clients have no account: no auth cookie means no team (and no
  // round trip to Auth for them).
  if (!jar.getAll().some((c) => /^sb-.*-auth-token/.test(c.name))) return false
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return Boolean(user)
}

export type PendingReportView = {
  report_id: string
  source: ReportViewSource
  visitor_hash: string
  device: string
  user_agent: string | null
  country: string | null
}

/**
 * Who's asking, read from the request: the row to write, or null when
 * this visit doesn't count (team, bot, prefetch). Call it while the
 * request is still in scope (before `after()`).
 */
export async function pendingReportView(
  reportId: string,
  source: ReportViewSource,
): Promise<PendingReportView | null> {
  const h = await headers()
  const ua = (h.get("user-agent") ?? "").slice(0, 512)
  if (isBotUserAgent(ua)) return null
  // A browser warming the page up (link prefetch) isn't a read.
  const purpose = `${h.get("purpose") ?? ""} ${h.get("sec-purpose") ?? ""}`
  if (/prefetch|prerender/i.test(purpose)) return null
  if (await isTeamSession()) return null

  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  const country = [
    h.get("cf-ipcountry"),
    h.get("x-vercel-ip-country"),
    h.get("x-country-code"),
  ]
    .map((c) => c?.trim().toUpperCase())
    .find((c) => c && /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1")

  return {
    report_id: reportId,
    source,
    visitor_hash: visitorHash(ip, ua),
    device: deviceOf(ua),
    user_agent: uaLabel(ua),
    country: country ?? null,
  }
}

/** Writes the visit unless the same visitor opened it in the last 30
 *  minutes. Never throws: tracking must not break the page. */
export async function saveReportView(view: PendingReportView) {
  try {
    const db = createAdminClient()
    const since = new Date(Date.now() - DEDUPE_MS).toISOString()
    const { data: recent, error } = await db
      .from("report_views" as never)
      .select("id")
      .eq("report_id" as never, view.report_id as never)
      .eq("visitor_hash" as never, view.visitor_hash as never)
      .gte("viewed_at" as never, since as never)
      .limit(1)
    if (error || recent?.length) return
    await db.from("report_views" as never).insert(view as never)
  } catch {
    // Not worth failing a client's page over.
  }
}
