import { canManageByRole } from "@/shared/lib/roles"
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
  const isPublicPage = isLoginPage || isAuthPage

  if (!user && !isPublicPage) {
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // ─── PERMISSION-BASED ACCESS CONTROL ─────────────────────────────────────
  // Pages that require explicit permission checks (beyond just being logged in)
  const protectedSlugs = [
    "/payroll",
    "/teams",
    "/settings/permission",
    "/calculator",
    "/sla-generator",
    "/performance",
    "/leave",
    "/calendar",
    "/dashboard",
    "/attendance",
  ]

  const matchedSlug = protectedSlugs.find((slug) =>
    url.pathname.startsWith(slug),
  )

  if (user && matchedSlug) {
    // Hard rule: settings/permission hanya untuk super admin
    // (tidak bisa dioverride oleh custom page permission)
    if (matchedSlug === "/settings/permission") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .maybeSingle()

      if (!profile?.is_super_admin) {
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // 1. Check if user has custom page permissions set
    const { data: customPermission } = await supabase
      .from("user_page_permissions")
      .select("granted")
      .eq("user_id", user.id)
      .eq("page_slug", matchedSlug)
      .maybeSingle()

    if (customPermission !== null && customPermission !== undefined) {
      // Custom permission exists — use it directly
      if (!customPermission.granted) {
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
      // Custom permission grants access — allow through
      return supabaseResponse
    }

    // 2. No custom permission — fallback to role-based access

    // For payroll and teams: requires admin role (existing behaviour)
    const roleRestrictedSlugs = ["/payroll", "/teams"]
    if (roleRestrictedSlugs.includes(matchedSlug)) {
      const userRole = user?.app_metadata?.role || "employee"
      let hasAdminAccess = canManageByRole(userRole)

      if (!hasAdminAccess) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        if (profile?.role) {
          hasAdminAccess = canManageByRole(profile.role)
        }
      }

      if (!hasAdminAccess) {
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }

    // All other protected slugs are accessible by default for authenticated users
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
