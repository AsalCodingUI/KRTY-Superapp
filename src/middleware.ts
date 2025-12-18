import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Cek session user
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // PROTEKSI ROUTE
    const url = request.nextUrl.clone()
    const isLoginPage = url.pathname.startsWith('/login')
    const isAuthPage = url.pathname.startsWith('/auth')
    const isPublicPage = isLoginPage || isAuthPage

    if (!user && !isPublicPage) {
        // Kalau belum login dan coba akses halaman private -> lempar ke login
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    if (user && isLoginPage) {
        // Kalau sudah login tapi buka halaman login -> lempar ke dashboard
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // ROLE-BASED ACCESS CONTROL untuk Payroll
    const isPayrollPage = url.pathname.startsWith('/payroll')
    if (user && isPayrollPage) {
        // Get user profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Only allow stakeholder
        if (profile?.role !== 'stakeholder') {
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    // ROLE-BASED ACCESS CONTROL untuk Admin Routes
    const adminRoutes = ['/settings/permission', '/teams']
    const isAdminRoute = adminRoutes.some(route => url.pathname.startsWith(route))

    if (user && isAdminRoute) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Only allow stakeholder
        if (profile?.role !== 'stakeholder') {
            url.pathname = '/dashboard'
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
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}