/**
 * Production Rate Limiting with Upstash Redis
 *
 * This module uses Upstash Redis for distributed rate limiting.
 * Falls back to in-memory rate limiting if Redis is not configured.
 *
 * Setup:
 * 1. Create Upstash account at upstash.com
 * 2. Create Redis database
 * 3. Add to .env.local:
 *    UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
 *    UPSTASH_REDIS_REST_TOKEN=your-token-here
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Simple rate limiter for fallback
import { simpleRateLimit } from "./simple-rate-limit"

// Redis client initialization
let redis: Redis | null = null
let usingRedis = false

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    usingRedis = true
  }
} catch (error) {
  console.warn(
    "Failed to initialize Upstash Redis, falling back to in-memory rate limiting:",
    error,
  )
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number | null
}

/**
 * General API rate limiter (100 requests per minute)
 */
export const apiRateLimit = createRateLimiter({
  limit: 100,
  window: "1 m" as const,
  prefix: "api",
})

/**
 * Auth endpoint rate limiter (5 requests per 15 minutes)
 * Protects against brute force attacks
 */
export const authRateLimit = createRateLimiter({
  limit: 5,
  window: "15 m" as const,
  prefix: "auth",
})

/**
 * Leave submission rate limiter (3 requests per hour)
 * Prevents spam leave submissions
 */
export const leaveSubmissionLimit = createRateLimiter({
  limit: 3,
  window: "1 h" as const,
  prefix: "leave-submission",
})

/**
 * Attendance clock-in rate limiter (10 requests per hour)
 */
export const attendanceRateLimit = createRateLimiter({
  limit: 10,
  window: "1 h" as const,
  prefix: "attendance",
})

/**
 * Create a rate limiter with configuration
 */
function createRateLimiter({
  limit,
  window,
  prefix,
}: {
  limit: number
  window: "1 m" | "15 m" | "1 h"
  prefix: string
}) {
  if (usingRedis && redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: true,
      prefix: `kretya-${prefix}`,
    })

    return async (identifier: string): Promise<RateLimitResult> => {
      const result = await ratelimit.limit(identifier)
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }
    }
  }

  const windowMs =
    window === "1 m" ? 60_000 : window === "15 m" ? 900_000 : 3_600_000

  return async (identifier: string): Promise<RateLimitResult> => {
    const result = simpleRateLimit(identifier, limit, windowMs)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.resetTime,
    }
  }
}

/**
 * Check if rate limiting is using Redis (production) or in-memory (development)
 */
export function isUsingRedis(): boolean {
  return usingRedis
}

/**
 * Get rate limit status without consuming a request
 */
export async function getRateLimitStatus(
  identifier: string,
  limiter: ReturnType<typeof createRateLimiter>,
): Promise<{ count: number; remaining: number; reset: number | null }> {
  if (!usingRedis) {
    const result = await limiter(identifier)
    return {
      count: result.limit - result.remaining,
      remaining: result.remaining,
      reset: result.reset,
    }
  }

  return { count: 0, remaining: 0, reset: null }
}
