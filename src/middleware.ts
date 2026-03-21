import { siteConfig } from "@/app/siteConfig"
import { IMPERSONATION_COOKIE_NAME } from "@/shared/lib/impersonation"
import { Database } from "@/shared/types/database.types"
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

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

  // ─── PERMISSION-BASED ACCESS CONTROL (PER-USER) ──────────────────────────
  // Gabung semua query dalam 1 roundtrip: profile + permissions
  const impersonatedUserId =
    request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value || null

  const [{ data: profile }, { data: userPermissions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_page_permissions")
      .select("page_slug, granted")
      .eq(
        "user_id",
        // Jika super admin sedang impersonate, cek permission target user
        impersonatedUserId && impersonatedUserId !== user.id
          ? impersonatedUserId
          : user.id,
      ),
  ])

  const effectiveUserId =
    profile?.is_super_admin && impersonatedUserId && impersonatedUserId !== user.id
      ? impersonatedUserId
      : user.id

  // Hard rule: settings/permission hanya untuk super admin
  if (url.pathname.startsWith(siteConfig.baseLinks.settings.permission)) {
    const isEffectiveSuperAdmin =
      effectiveUserId === user.id && profile?.is_super_admin === true
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

  if (!matched || matched.granted !== true) {
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
