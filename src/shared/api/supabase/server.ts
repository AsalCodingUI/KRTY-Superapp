import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { cache } from "react"

/**
 * One Supabase client per server request. `cache()` scopes it to the current
 * render, so a page, its server actions and entity helpers all share it —
 * and share its memoized `auth.getUser()` (one Auth round trip, not one per
 * helper). Outside a render (route handlers) `cache()` doesn't dedupe and
 * every call still gets a fresh client.
 */
export const createClient = cache(async () => {
  // Check if env vars are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Supabase env vars not available - creating mock client for build",
    )
    // Return a minimal mock for build time
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({ data: null, error: null }),
      }),
    } as any
  }

  const cookieStore = await cookies()

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })

  // Memoize the argument-less getUser() for this client's lifetime (one
  // request). Any auth mutation on the client drops the memo.
  const auth = client.auth
  const getUser = auth.getUser.bind(auth)
  let pendingUser: ReturnType<typeof getUser> | null = null
  auth.getUser = ((jwt?: string) => {
    if (jwt) return getUser(jwt)
    pendingUser ??= getUser()
    return pendingUser
  }) as typeof auth.getUser
  for (const method of [
    "updateUser",
    "signOut",
    "setSession",
    "refreshSession",
    "exchangeCodeForSession",
    "verifyOtp",
  ] as const) {
    const original = (auth[method] as (...args: unknown[]) => unknown).bind(
      auth,
    )
    ;(auth as unknown as Record<string, unknown>)[method] = (
      ...args: unknown[]
    ) => {
      pendingUser = null
      return original(...args)
    }
  }

  return client
})
