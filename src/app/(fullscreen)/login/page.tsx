"use client"

import { Button } from "@/shared/ui"
import { createClient } from "@/shared/api/supabase/client"
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
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
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
    <div className="bg-surface flex min-h-screen flex-1 flex-col justify-center px-4 lg:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h3 className="text-heading-md text-content dark:text-content mt-6 text-center">
          Sign in to kretya account
        </h3>
        <p className="text-body-sm text-content-subtle mt-2 text-center">
          Login securely with your Google Workspace or Gmail account
        </p>

        <div className="mt-6">
          <div className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-danger-100 text-body-sm text-danger ring-danger-200 rounded-md p-3 ring-1 ring-inset">
                {error}
              </div>
            )}

            <Button
              onClick={handleGoogleLogin}
              variant="secondary"
              className="w-full flex items-center justify-center gap-3"
              disabled={loading}
            >
              <span>{loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}</span>
            </Button>


          </div>
        </div>
      </div>
    </div>
  )
}
