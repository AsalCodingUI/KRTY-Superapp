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

  // Cek session user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // PROTEKSI ROUTE
  const url = request.nextUrl.clone()
  const isLoginPage = url.pathname.startsWith("/login")
  const isAuthPage = url.pathname.startsWith("/auth")
  const isApiRoute = url.pathname.startsWith("/api")
  const isPublicPage = isLoginPage || isAuthPage

  // Biarkan API routes mengembalikan status JSON (401/403) dari route handler,
  // jangan dipaksa redirect ke /login.
  if (!user && !isPublicPage && !isApiRoute) {
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // ─── PERMISSION-BASED ACCESS CONTROL (PER-USER) ──────────────────────────
  if (user && !isPublicPage && !isApiRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .maybeSingle()

    let effectiveUserId = user.id
    if (profile?.is_super_admin) {
      const impersonatedUserId =
        request.cookies.get(IMPERSONATION_COOKIE_NAME)?.value || null
      if (impersonatedUserId && impersonatedUserId !== user.id) {
        const { data: targetProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", impersonatedUserId)
          .maybeSingle()
        if (targetProfile?.id) {
          effectiveUserId = targetProfile.id
        }
      }
    }

    // Hard rule: settings/permission hanya untuk super admin
    // (tidak bisa dioverride oleh custom page permission)
    if (url.pathname.startsWith(siteConfig.baseLinks.settings.permission)) {
      const isEffectiveSuperAdmin =
        effectiveUserId === user.id && profile?.is_super_admin === true
      if (!isEffectiveSuperAdmin) {
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }

    // 1) Ambil seluruh permission user
    const { data: userPermissions } = await supabase
      .from("user_page_permissions")
      .select("page_slug, granted")
      .eq("user_id", effectiveUserId)

    const rows = userPermissions || []
    // 2) Cari permission paling spesifik (longest prefix match)
    const matched = rows
      .filter((row) => url.pathname.startsWith(row.page_slug))
      .sort((a, b) => b.page_slug.length - a.page_slug.length)[0]

    // 3) Jika tidak ada match / explicit deny => redirect ke page pertama yang di-grant
    if (!matched || matched.granted !== true) {
      const firstAllowed = rows.find((row) => row.granted)?.page_slug

      if (firstAllowed && firstAllowed !== url.pathname) {
        url.pathname = firstAllowed
        return NextResponse.redirect(url)
      }

      // Hindari redirect loop untuk user login tanpa permission row yang match.
      // Biarkan request lanjut saat sudah berada di fallback default.
      const fallbackPath = "/dashboard"
      if (url.pathname !== fallbackPath) {
        url.pathname = fallbackPath
        return NextResponse.redirect(url)
      }
      return supabaseResponse
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
