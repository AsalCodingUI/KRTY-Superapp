import type { User } from "@supabase/supabase-js"
import { logError } from "@/shared/lib/utils/logger"

type SupabaseAuthLike = {
  auth: {
    getUser: () => Promise<{
      data: { user: User | null }
      error: Error | null
    }>
  }
}

type GetCurrentUserResult =
  | {
      user: User
      error: null
    }
  | {
      user: null
      error: string | null
    }

export async function getCurrentUserSafely(
  supabase: SupabaseAuthLike,
  context: string,
): Promise<GetCurrentUserResult> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      logError("Failed to get authenticated user", error, { context })
      return { user: null, error: error.message || "Unauthorized" }
    }

    return { user, error: null }
  } catch (error) {
    logError("Failed to get authenticated user", error, { context })
    return {
      user: null,
      error: "Unable to verify your session right now. Please try again.",
    }
  }
}
