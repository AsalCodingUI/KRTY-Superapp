import { siteConfig } from "@/app/siteConfig"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { dedupeProfilesByEmail } from "@/shared/lib/profile-dedupe"
import { Database } from "@/shared/types/database.types"
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PERMISSION_CACHE_COOKIE = "krt_permission_cache"
const PERMISSION_CACHE_TTL_MS = 5 * 60 * 1000

type CachedPermissionRow = {
  page_slug: string
  granted: boolean
}

type MiddlewarePermissionCache = {
  authUserId: string
  email: string | null
  canonicalUserId: string
  effectiveUserId: string
  isSuperAdmin: boolean
  impersonatedUserId: string | null
  rows: CachedPermissionRow[]
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
  const isNotificationsPage = url.pathname.startsWith("/notifications")
  const isPublicPage = isLoginPage || isAuthPage

  // Biarkan API routes mengembalikan status JSON (401/403) dari route handler,
  // jangan dipaksa redirect ke /login.
  // Biarkan public pages dan API routes lewat tanpa auth check.
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
    url.pathname = "/login"
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
  let userPermissions: CachedPermissionRow[] = []

  if (cachedPermissions) {
    canonicalUserId = cachedPermissions.canonicalUserId
    effectiveUserId = cachedPermissions.effectiveUserId
    isSuperAdmin = cachedPermissions.isSuperAdmin
    userPermissions = cachedPermissions.rows
  } else {
    const [{ data: directProfile }, { data: emailProfiles }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, is_super_admin, created_at")
        .eq("id", user.id)
        .maybeSingle(),
      user.email
        ? supabase
            .from("profiles")
            .select("id, email, is_super_admin, created_at")
            .eq("email", user.email)
        : Promise.resolve({ data: [] as Array<{ id: string; email: string | null; is_super_admin: boolean | null; created_at: string | null }> }),
    ])

    const canonicalProfile = directProfile
      ? directProfile
      : dedupeProfilesByEmail(
          (emailProfiles || []) as Array<{
            id: string
            email: string | null
            is_super_admin: boolean | null
            created_at: string | null
          }>,
        )[0] || null

    canonicalUserId = canonicalProfile?.id || user.id
    isSuperAdmin = canonicalProfile?.is_super_admin === true
    effectiveUserId =
      isSuperAdmin &&
      impersonatedUserId &&
      impersonatedUserId !== canonicalUserId
        ? impersonatedUserId
        : canonicalUserId

    const { data: permissionRows } = await supabase
      .from("user_page_permissions")
      .select("page_slug, granted")
      .eq("user_id", effectiveUserId)

    userPermissions = (permissionRows || []) as CachedPermissionRow[]

    writePermissionCache(supabaseResponse, {
      authUserId: user.id,
      email: user.email || null,
      canonicalUserId,
      effectiveUserId,
      isSuperAdmin,
      impersonatedUserId,
      rows: userPermissions,
      expiresAt: Date.now() + PERMISSION_CACHE_TTL_MS,
    })
  }

  // Hard rule: settings/permission hanya untuk super admin
  if (url.pathname.startsWith(siteConfig.baseLinks.settings.permission)) {
    const isEffectiveSuperAdmin =
      effectiveUserId === canonicalUserId &&
      isSuperAdmin === true
    if (!isEffectiveSuperAdmin) {
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  // Cek permission — longest prefix match
  const rows = userPermissions || []
  const matched = rows
    .filter((row) => url.pathname.startsWith(row.page_slug))
    .sort((a, b) => b.page_slug.length - a.page_slug.length)[0]

  if (isNotificationsPage) {
    return supabaseResponse
  }

  // A path no permission row covers isn't an app page: let Next render its
  // 404 instead of bouncing to the dashboard. Only known pages are gated.
  if (!matched) {
    return supabaseResponse
  }

  if (matched.granted !== true) {
    const firstAllowed = rows.find((row) => row.granted)?.page_slug

    if (firstAllowed && firstAllowed !== url.pathname) {
      url.pathname = firstAllowed
      return NextResponse.redirect(url)
    }

    const fallbackPath = "/dashboard"
    if (url.pathname !== fallbackPath) {
      url.pathname = fallbackPath
      return NextResponse.redirect(url)
    }
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
