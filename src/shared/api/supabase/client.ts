import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, env vars might not be available
    // Return a dummy client that won't be used
    if (typeof window === 'undefined') {
      console.warn("Supabase env vars not available during build - this is expected")
      // Return a minimal mock client for build time
      return {
        auth: {},
        from: () => ({}),
      } as any
    }

    // At runtime (browser), this is a real error
    console.error(
      "Supabase URL or Anon Key is missing. Please check your .env file.",
    )
    throw new Error("Supabase URL or Anon Key is missing.")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
