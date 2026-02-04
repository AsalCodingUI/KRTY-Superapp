import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL or Anon Key is missing. Please check your .env file.")
        throw new Error("Supabase URL or Anon Key is missing.")
    }

    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
    )
}