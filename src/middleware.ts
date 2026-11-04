import { DEFAULT_LOCALE_HEADER, LOCALE_COOKIE } from "@/shared/i18n/config"
import { isClientHost, isClientPath } from "@/shared/lib/client-site"
import { renameLegacyParams } from "@/shared/lib/url-params"
import {
  accessLevel,
  canOpenPage,
  type AccessLevel,
} from "@/shared/config/access"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { encodeViewer, VIEWER_HEADER } from "@/shared/lib/viewer-context"
import { localSessionUser } from "@/shared/api/supabase/verify-token"
import { Database } from "@/shared/types/database.types"
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PERMISSION_CACHE_COOKIE = "krt_access_cache"
const PERMISSION_CACHE_TTL_MS = 5 * 60 * 1000

type MiddlewarePermissionCache = {
  authUserId: string
  email: string | null
  canonicalUserId: string
  effectiveUserId: string
  isSuperAdmin: boolean
  impersonatedUserId: string | null
  level: AccessLevel
  expiresAt: number
}

// The cache is signed: pages trust what middleware passes on from it, so a
// hand-written cookie must not pass for it. No key, no cache.
const encoder = new TextEncoder()
let cacheKey: Promise<CryptoKey> | null = null

function permissionCacheKey() {
  const secret = process.env.SUPABASE_SERVICE_KEY
  if (!secret) return null
  cacheKey ??= crypto.subtle.importKey(
    "raw",
    encoder.encode(`${PERMISSION_CACHE_COOKIE}:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  )
  return cacheKey
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

async function readPermissionCache(
  request: NextRequest,
  userId: string,
  email: string | null,
  impersonatedUserId: string | null,
): Promise<MiddlewarePermissionCache | null> {
  const raw = request.cookies.get(PERMISSION_CACHE_COOKIE)?.value
  const key = permissionCacheKey()
  if (!raw || !key) return null

  try {
    const [payload, signature] = raw.split(".")
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
    ) as MiddlewarePermissionCache
    if (parsed.authUserId !== userId) return null
    if ((parsed.email || null) !== (email || null)) return null
    if ((parsed.impersonatedUserId || null) !== (impersonatedUserId || null)) {
      return null
    }
    if (parsed.expiresAt <= Date.now()) return null
    if (!parsed.level) return null
    return parsed
  } catch {
    return null
  }
}

async function writePermissionCache(
  response: NextResponse,
  cache: MiddlewarePermissionCache,
) {
  const key = permissionCacheKey()
  if (!key) return
  const payload = toBase64Url(encoder.encode(JSON.stringify(cache)))
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", await key, encoder.encode(payload)),
  )
  response.cookies.set(
    PERMISSION_CACHE_COOKIE,
    `${payload}.${toBase64Url(signature)}`,
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(cache.expiresAt),
    },
  )
}

export async function middleware(request: NextRequest) {
  // The public client site only serves the portal and shared reports; the
  // rest of the app isn't there (it's reached over the VPN).
  if (
    isClientHost(request.headers.get("host")) &&
    !isClientPath(request.nextUrl.pathname)
  ) {
    return new NextResponse("Not found", { status: 404 })
  }

  // Old Indonesian param names (?periode=, ?proyek=…) → the English ones.
  if (!request.nextUrl.pathname.startsWith("/api")) {
    const renamed = renameLegacyParams(request.nextUrl)
    if (renamed) return NextResponse.redirect(renamed, 308)
  }

  // Only middleware says who the viewer is (below): never a client.
  request.headers.delete(VIEWER_HEADER)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // PROTEKSI ROUTE
  const url = request.nextUrl.clone()
  const isLoginPage = url.pathname.startsWith("/login")
  const isAuthPage = url.pathname.startsWith("/auth")
  const isApiRoute = url.pathname.startsWith("/api")
  // A report shared with a client (/r/<token>): no account needed.
  const isSharedReport = url.pathname.startsWith("/r/")
  // A project's client portal (/p/<token>), opened with its PIN.
  const isClientPortal = url.pathname.startsWith("/p/")
  // A brief the client fills (/b/<token>): its secret link is the key.
  const isClientBrief = url.pathname.startsWith("/b/")
  // The desktop app's window: it shows its own sign-in screen.
  const isDesktopApp = url.pathname === "/desktop"
  // Link-preview cards (opengraph-image / twitter-image, any segment):
  // crawlers fetch them without an account.
  const isShareCard =
    /\/(?:opengraph|twitter)-image(?:-[a-z0-9]+)?(?:\/[^/]+)?$/.test(
      url.pathname,
    )
  const isPublicPage =
    isLoginPage ||
    isAuthPage ||
    isSharedReport ||
    isClientPortal ||
    isClientBrief ||
    isDesktopApp ||
    isShareCard

  // Biarkan API routes mengembalikan status JSON (401/403) dari route handler,
  // jangan dipaksa redirect ke /login.
  // Biarkan public pages dan API routes lewat tanpa auth check.
  // Client pages speak English until the visitor picks a language.
  if (
    (isSharedReport || isClientPortal || isClientBrief) &&
    !request.cookies.has(LOCALE_COOKIE)
  ) {
    const headers = new Headers(request.headers)
    headers.set(DEFAULT_LOCALE_HEADER, "en")
    const response = NextResponse.next({ request: { headers } })
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => response.cookies.set(cookie))
    return response
  }

  if (isPublicPage || isApiRoute) {
    // Untuk login page, cek apakah sudah punya session → redirect ke dashboard
    if (isLoginPage) {
      const user =
        (await localSessionUser(supabase.auth).catch(() => null)) ??
        (await supabase.auth.getUser()).data.user
      if (user) {
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  // Cek session user — hanya untuk protected routes. The token is checked
  // here when the JWT secret is set (no Auth round trip); getSession() in
  // there still refreshes it and writes the cookies (setAll above).
  const user =
    (await localSessionUser(supabase.auth).catch(() => null)) ??
    (await supabase.auth.getUser()).data.user

  if (!user) {
    // Back to where they were going after signing in (a bookmark, a link
    // from a notification or a chat).
    const next = `${request.nextUrl.pathname}${request.nextUrl.search}`
    url.pathname = "/login"
    url.search =
      next === "/" || next === "/dashboard"
        ? ""
        : `?next=${encodeURIComponent(next)}`
    return NextResponse.redirect(url)
  }

  const impersonatedUserId =
    request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value || null

  const cachedPermissions = await readPermissionCache(
    request,
    user.id,
    user.email || null,
    impersonatedUserId,
  )

  let canonicalUserId = user.id
  let effectiveUserId = user.id
  let isSuperAdmin = false
  let level: AccessLevel = "employee"

  if (cachedPermissions) {
    canonicalUserId = cachedPermissions.canonicalUserId
    effectiveUserId = cachedPermissions.effectiveUserId
    isSuperAdmin = cachedPermissions.isSuperAdmin
    level = cachedPermissions.level
  } else {
    type Row = {
      id: string
      email: string | null
      role: string | null
      job_title: string | null
      is_super_admin: boolean | null
      created_at: string | null
    }
    const columns = "id, email, role, job_title, is_super_admin, created_at"
    const [{ data: directProfile }, { data: emailProfiles }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(columns)
          .eq("id", user.id)
          .maybeSingle(),
        user.email
          ? supabase.from("profiles").select(columns).eq("email", user.email)
          : Promise.resolve({ data: [] as Row[] }),
      ])

    const canonicalProfile = directProfile
      ? (directProfile as Row)
      : dedupeProfilesByEmail((emailProfiles || []) as Row[])[0] || null

    canonicalUserId = canonicalProfile?.id || user.id
    isSuperAdmin = canonicalProfile?.is_super_admin === true

    let effectiveProfile = canonicalProfile
    if (
      isSuperAdmin &&
      impersonatedUserId &&
      impersonatedUserId !== canonicalUserId
    ) {
      const { data: target } = await supabase
        .from("profiles")
        .select(columns)
        .eq("id", impersonatedUserId)
        .maybeSingle()
      if (target) effectiveProfile = target as Row
    }
    effectiveUserId = effectiveProfile?.id || canonicalUserId
    level = accessLevel(effectiveProfile)

    await writePermissionCache(supabaseResponse, {
      authUserId: user.id,
      email: user.email || null,
      canonicalUserId,
      effectiveUserId,
      isSuperAdmin,
      impersonatedUserId,
      level,
      expiresAt: Date.now() + PERMISSION_CACHE_TTL_MS,
    })
  }

  // Page access comes from the level (shared/config/access.ts). Which
  // projects someone may open is checked by the project pages themselves.
  if (!canOpenPage(url.pathname, level)) {
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Hand the answer to the page (shared/lib/viewer-context.ts), keeping the
  // refreshed session and cache cookies.
  request.headers.set(
    VIEWER_HEADER,
    encodeViewer({
      authUserId: user.id,
      canonicalUserId,
      effectiveUserId,
      isSuperAdmin,
      level,
    }),
  )
  const response = NextResponse.next({ request })
  supabaseResponse.cookies
    .getAll()
    .forEach((cookie) => response.cookies.set(cookie))
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3)$).*)",
  ],
}
