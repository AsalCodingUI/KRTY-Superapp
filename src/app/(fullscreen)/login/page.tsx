"use client"

import { createClient } from "@/shared/api/supabase/client"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function LoginPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // The redirect happens automatically via Supabase
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Google login failed. Please try again."
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-4 lg:px-6">
      <div className="w-full">
        <h3 className="text-foreground dark:text-foreground mt-6 text-center text-lg font-semibold">
          Sign in to kretya account
        </h3>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Login securely with your Google Workspace or Gmail account
        </p>

        <div className="mt-6">
          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 text-destructive ring-destructive/30 rounded-md p-3 text-sm ring-1 ring-inset">
                {error}
              </div>
            )}

            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-hug mx-auto flex items-center gap-3"
              disabled={loading}
            >
              <span>
                {loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
