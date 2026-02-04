/**
 * Simple In-Memory Rate Limiting (Development Only)
 *
 * ⚠️ WARNING: This is NOT suitable for production!
 * - Data is lost on server restart
 * - Does not work in serverless/multi-instance deployments
 * - Use Upstash Redis for production (rate-limit.ts)
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const requestCounts = new Map<string, RateLimitRecord>()

/**
 * Simple in-memory rate limiter
 *
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param limit - Maximum requests allowed in window
 * @param windowMs - Time window in milliseconds
 * @returns Object with success status and rate limit info
 */
export function simpleRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): {
  success: boolean
  remaining: number
  resetTime: number
  limit: number
} {
  const now = Date.now()
  const record = requestCounts.get(identifier)

  // Create new record if doesn't exist or window expired
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs
    requestCounts.set(identifier, {
      count: 1,
      resetTime,
    })
    return {
      success: true,
      remaining: limit - 1,
      resetTime,
      limit,
    }
  }

  // Increment count if under limit
  if (record.count < limit) {
    record.count++
    return {
      success: true,
      remaining: limit - record.count,
      resetTime: record.resetTime,
      limit,
    }
  }

  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    resetTime: record.resetTime,
    limit,
  }
}

/**
 * Clean up expired records to prevent memory leaks
 * Run this periodically (e.g., every minute)
 */
export function cleanupExpiredRecords(): void {
  const now = Date.now()
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key)
    }
  }
}

/**
 * Get current rate limit status without consuming a request
 */
export function getRateLimitStatus(identifier: string): {
  count: number
  remaining: number
  resetTime: number | null
} {
  const record = requestCounts.get(identifier)
  if (!record) {
    return { count: 0, remaining: 0, resetTime: null }
  }

  const now = Date.now()
  if (now > record.resetTime) {
    requestCounts.delete(identifier)
    return { count: 0, remaining: 0, resetTime: null }
  }

  return {
    count: record.count,
    remaining: 0, // We don't know the limit here
    resetTime: record.resetTime,
  }
}

// Auto-cleanup expired records every 60 seconds
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredRecords, 60_000)
}
