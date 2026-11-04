import type { AccessLevel } from "@/shared/config/access"

/**
 * Who is viewing, as middleware worked it out for this request: pages read
 * it instead of looking the same profiles up again. Middleware drops any
 * copy a client sends and sets it only after checking the session; it is
 * also signed and short-lived, so a header that slipped through some other
 * way (a proxy, a route that forwards headers) can't pass for it.
 * viewer-context-server.ts still matches it to the signed-in user.
 */
export const VIEWER_HEADER = "x-krt-viewer"

/** How long a signed viewer stays good: one request's worth. */
const TTL_MS = 60_000

export type ViewerContext = {
  authUserId: string
  canonicalUserId: string
  effectiveUserId: string
  isSuperAdmin: boolean
  level: AccessLevel
}

const encoder = new TextEncoder()
let viewerKey: Promise<CryptoKey> | null = null

/** Null without the service key: then no header is set or trusted. */
function signingKey() {
  const secret = process.env.SUPABASE_SERVICE_KEY
  if (!secret) return null
  viewerKey ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(`${VIEWER_HEADER}:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
  return viewerKey
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4))
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

export async function encodeViewer(viewer: ViewerContext) {
  const key = signingKey()
  if (!key) return null
  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ ...viewer, exp: Date.now() + TTL_MS })),
  )
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", await key, encoder.encode(payload)),
  )
  return `${payload}.${toBase64Url(signature)}`
}

export async function decodeViewer(
  value: string | null | undefined,
): Promise<ViewerContext | null> {
  const key = signingKey()
  if (!value || !key) return null
  try {
    const [payload, signature] = value.split(".")
    if (!payload || !signature) return null
    const valid = await crypto.subtle.verify(
      "HMAC",
      await key,
      fromBase64Url(signature),
      encoder.encode(payload),
    )
    if (!valid) return null
    const parsed = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as ViewerContext & { exp?: number }
    if (
      typeof parsed?.exp !== "number" ||
      parsed.exp <= Date.now() ||
      typeof parsed.authUserId !== "string" ||
      typeof parsed.canonicalUserId !== "string" ||
      typeof parsed.effectiveUserId !== "string" ||
      !parsed.level
    ) {
      return null
    }
    return {
      authUserId: parsed.authUserId,
      canonicalUserId: parsed.canonicalUserId,
      effectiveUserId: parsed.effectiveUserId,
      isSuperAdmin: parsed.isSuperAdmin === true,
      level: parsed.level,
    }
  } catch {
    return null
  }
}
