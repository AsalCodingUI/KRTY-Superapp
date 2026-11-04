import type { SupabaseClient, User } from "@supabase/supabase-js"

/**
 * Checks the session's access token here instead of asking the Auth server
 * (`auth.getUser()` is a network call on every request). Self-hosted
 * Supabase signs with HS256 and a shared secret, so this needs that secret
 * (SUPABASE_JWT_SECRET, the stack's JWT_SECRET); without it, or for any
 * token it can't vouch for, callers fall back to `getUser()`.
 * Works in middleware (edge) and on the server (Web Crypto only).
 */

const encoder = new TextEncoder()
let cachedKey: { secret: string; key: Promise<CryptoKey> } | null = null

function hmacKey(secret: string) {
  if (cachedKey?.secret !== secret) {
    cachedKey = {
      secret,
      key: crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
      ),
    }
  }
  return cachedKey.key
}

function base64UrlBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function base64UrlJson(value: string) {
  return JSON.parse(new TextDecoder().decode(base64UrlBytes(value)))
}

export function canVerifyLocally() {
  return Boolean(process.env.SUPABASE_JWT_SECRET)
}

/**
 * The signed-in user an access token names, or null when it can't be
 * verified here (no secret, another algorithm, bad signature, expired, not
 * a user's token). Only `id` and `email` are read in the app; the rest of
 * the User comes from the token's claims.
 */
export async function verifyAccessToken(token: string): Promise<User | null> {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret || !token) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    const header = base64UrlJson(parts[0])
    if (header?.alg !== "HS256") return null
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      base64UrlBytes(parts[2]),
      encoder.encode(`${parts[0]}.${parts[1]}`),
    )
    if (!valid) return null

    const claims = base64UrlJson(parts[1])
    const now = Math.floor(Date.now() / 1000)
    if (typeof claims?.exp !== "number" || claims.exp <= now) return null
    if (typeof claims.nbf === "number" && claims.nbf > now) return null
    const aud: unknown[] = [claims.aud].flat()
    // A user's session token, not the anon or service key.
    if (!aud.includes("authenticated") || claims.role !== "authenticated") {
      return null
    }
    if (typeof claims.sub !== "string" || !claims.sub) return null

    return {
      id: claims.sub,
      aud: "authenticated",
      role: claims.role,
      email: claims.email || undefined,
      phone: claims.phone || undefined,
      app_metadata: claims.app_metadata ?? {},
      user_metadata: claims.user_metadata ?? {},
      is_anonymous: claims.is_anonymous === true,
      created_at: "",
    } as User
  } catch {
    return null
  }
}

/**
 * The user from the session cookie, verified locally. `getSession()` still
 * refreshes an expiring token (and writes the cookies through the client's
 * setAll), as `getUser()` did. Null means: ask `getUser()`.
 */
export async function localSessionUser(
  auth: SupabaseClient["auth"],
): Promise<User | null> {
  if (!canVerifyLocally()) return null
  const {
    data: { session },
  } = await auth.getSession()
  if (!session?.access_token) return null
  return verifyAccessToken(session.access_token)
}
