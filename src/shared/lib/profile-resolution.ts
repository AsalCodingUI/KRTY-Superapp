import { mergeDuplicateProfiles } from "@/shared/lib/profile-dedupe"

type SupabaseLike = {
  from: (table: string) => {
    select: (query: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>
        order: (
          column: string,
          options?: { ascending?: boolean },
        ) => Promise<{ data: unknown; error: { code?: string; message?: string } | null }>
      }
    }
  }
}

export async function resolveProfileByUserIdOrEmail<T extends { id: string; email?: string | null }>(
  supabase: SupabaseLike,
  select: string,
  userId: string,
  email?: string | null,
): Promise<T | null> {
  const { data: byId, error: byIdError } = await supabase
    .from("profiles")
    .select(select)
    .eq("id", userId)
    .maybeSingle()

  if (byIdError && byIdError.code !== "PGRST116") {
    throw new Error(byIdError.message || "Failed to fetch profile by id")
  }

  if (byId) {
    return byId as T
  }

  if (!email) {
    return null
  }

  const { data: byEmail, error: byEmailError } = await supabase
    .from("profiles")
    .select(select)
    .eq("email", email)
    .order("created_at", { ascending: true })

  if (byEmailError && byEmailError.code !== "PGRST116") {
    throw new Error(byEmailError.message || "Failed to fetch profile by email")
  }

  const profiles = (byEmail || []) as T[]
  if (profiles.length === 0) return null
  if (profiles.length === 1) return profiles[0]

  return mergeDuplicateProfiles(profiles)
}
