import { NextRequest, NextResponse } from "next/server"

/**
 * Simple in-memory rate limiter
 * NOTE: In a serverless/clustered environment (like Vercel), this memory is not shared.
 * For production, use Redis or a database (e.g. Upstash).
 */
const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now()
      rateLimitMap.forEach((record, ip) => {
        if (now - record.lastReset > 60 * 1000 * 60) {
          rateLimitMap.delete(ip)
        }
      })
    },
    5 * 60 * 1000,
  )
}

interface RateLimitOptions {
  limit?: number // Max requests
  windowMs?: number // Time window in milliseconds
}

function getClientIp(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return req.headers.get("x-real-ip") ?? "unknown"
}

function parseHostFromUrl(value: string) {
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return null
  }
}

function getRequestHost(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    req.nextUrl.host
  )
    .toLowerCase()
    .trim()
}

export function checkRateLimit(
  req: NextRequest,
  { limit = 10, windowMs = 60 * 1000 }: RateLimitOptions = {},
) {
  const ip = getClientIp(req)
  const now = Date.now()

  const record = rateLimitMap.get(ip) ?? { count: 0, lastReset: now }

  // Reset window if expired
  if (now - record.lastReset > windowMs) {
    record.count = 0
    record.lastReset = now
  }

  // Check limit
  if (record.count >= limit) {
    return false
  }

  // Increment
  record.count++
  rateLimitMap.set(ip, record)

  return true
}

/**
 * CSRF Protection for API Routes
 * Verifies that the request Origin/Referer matches the request host.
 */
export function checkCSRF(req: NextRequest) {
  // Skip for GET/HEAD requests (read-only)
  if (["GET", "HEAD"].includes(req.method)) return true

  const origin = req.headers.get("origin")
  const referer = req.headers.get("referer")
  const requestHost = getRequestHost(req)

  if (!requestHost) return false

  if (!origin && !referer) {
    // Block requests with no origin/referer (unless it's a server-to-server call you explicitly allow)
    return false
  }

  if (origin) {
    const originHost = parseHostFromUrl(origin)
    if (!originHost || originHost !== requestHost) return false
  }

  if (referer) {
    const refererHost = parseHostFromUrl(referer)
    if (!refererHost || refererHost !== requestHost) return false
  }

  return true
}

/**
 * Combined security middleware helper
 * Returns a response if check fails, or null if passes
 */
export function guardApiRoute(req: NextRequest) {
  // 1. Check CSRF
  if (!checkCSRF(req)) {
    return NextResponse.json(
      { success: false, error: "Invalid Origin/Referer (CSRF)" },
      { status: 403 },
    )
  }

  // 2. Check Rate Limit (e.g., 20 requests per minute per IP)
  if (!checkRateLimit(req, { limit: 20, windowMs: 60 * 1000 })) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429 },
    )
  }

  return null
}
