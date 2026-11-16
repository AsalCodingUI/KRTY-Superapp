import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { createHash, createHmac, randomBytes } from "node:crypto"
import { createAdminClient } from "@/shared/api/supabase/admin"
import { accessLevel } from "@/shared/config/access"

/**
 * Personal API tokens (migrations/api_tokens.sql): "krty_" and 43 random
 * characters, kept only as a SHA-256 hash. A request with one acts as its
 * owner: the server signs a short-lived session token for them (the stack's
 * JWT secret), so the database's policies apply exactly as in the app.
 */

export const TOKEN_PREFIX = "krty_"

export function newApiToken() {
  const token = TOKEN_PREFIX + randomBytes(32).toString("base64url")
  return { token, hash: hashApiToken(token), prefix: token.slice(0, 10) }
}

export const hashApiToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")

export type TokenAuth = {
  tokenId: string
  profileId: string
  email: string | null
  name: string | null
  scope: "read" | "write"
}

/** `last_used_at` is written at most this often per token. */
const TOUCH_MS = 5 * 60 * 1000

/**
 * The owner of the request's `Authorization: Bearer krty_…` token, or null
 * (none, unknown, expired, or its owner isn't a stakeholder any more).
 */
export async function authenticateApiToken(
  request: Request,
): Promise<TokenAuth | null> {
  const header = request.headers.get("authorization") ?? ""
  const token = /^Bearer\s+(\S+)$/i.exec(header)?.[1]
  if (!token?.startsWith(TOKEN_PREFIX) || token.length > 100) return null

  const admin = createAdminClient()
  const { data } = await admin
    .from("api_tokens")
    .select(
      "id, profile_id, scope, expires_at, last_used_at, profile:profiles(email, full_name, role, job_title)",
    )
    .eq("token_hash", hashApiToken(token))
    .maybeSingle()
  const row = data as unknown as {
    id: string
    profile_id: string
    scope: "read" | "write"
    expires_at: string | null
    last_used_at: string | null
    profile: {
      email: string | null
      full_name: string | null
      role: string | null
      job_title: string | null
    } | null
  } | null
  if (!row?.profile) return null
  if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now())
    return null
  // Stakeholders only, checked on every request (a role can change).
  if (accessLevel(row.profile) !== "stakeholder") return null

  if (
    !row.last_used_at ||
    Date.now() - new Date(row.last_used_at).getTime() > TOUCH_MS
  )
    void admin
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", row.id)
      .then(() => {})

  return {
    tokenId: row.id,
    profileId: row.profile_id,
    email: row.profile.email,
    name: row.profile.full_name,
    scope: row.scope,
  }
}

const b64url = (value: string | Buffer) =>
  Buffer.from(value).toString("base64url")

/** A session token for `profileId`, valid a few minutes (HS256). */
function signSession(profileId: string, email: string | null) {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error("SUPABASE_JWT_SECRET is not set")
  const now = Math.floor(Date.now() / 1000)
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = b64url(
    JSON.stringify({
      sub: profileId,
      email: email ?? undefined,
      role: "authenticated",
      aud: "authenticated",
      iat: now,
      exp: now + 300,
    }),
  )
  const sig = createHmac("sha256", secret)
    .update(`${head}.${body}`)
    .digest("base64url")
  return `${head}.${body}.${sig}`
}

/** A Supabase client acting as the token's owner (their RLS). */
export function clientAs(auth: TokenAuth): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${signSession(auth.profileId, auth.email)}`,
        },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )
}
