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

function readPermissionCache(
  request: NextRequest,
  userId: string,
  email: string | null,
  impersonatedUserId: string | null,
): MiddlewarePermissionCache | null {
  const raw = request.cookies.get(PERMISSION_CACHE_COOKIE)?.value
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as MiddlewarePermissionCache
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

function writePermissionCache(
  response: NextResponse,
  cache: MiddlewarePermissionCache,
) {
  response.cookies.set(PERMISSION_CACHE_COOKIE, JSON.stringify(cache), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(cache.expiresAt),
  })
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
  const isPublicPage =
    isLoginPage || isAuthPage || isSharedReport || isClientPortal

  // Biarkan API routes mengembalikan status JSON (401/403) dari route handler,
  // jangan dipaksa redirect ke /login.
  // Biarkan public pages dan API routes lewat tanpa auth check.
  // Client pages speak English until the visitor picks a language.
  if (
    (isSharedReport || isClientPortal) &&
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  // Cek session user — hanya untuk protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const cachedPermissions = readPermissionCache(
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

    writePermissionCache(supabaseResponse, {
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

  return supabaseResponse
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
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
