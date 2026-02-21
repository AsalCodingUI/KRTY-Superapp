"use client"

import { Button, Label, TextInput } from "@/components/ui"
import { createClient } from "@/shared/api/supabase/client"
import { useState } from "react"

export default function LoginPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTestForm, setShowTestForm] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

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

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check basic email format to avoid native browser unstyled popups
    if (!email.includes('@')) {
      setError(`Please include an '@' in the email address. '${email}' is missing an '@'.`)
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      window.location.href = "/dashboard"
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Login failed. Please try again."
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
          <div className="space-y-6">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>{loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}</span>
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs font-medium leading-6">
                <span className="bg-white dark:bg-slate-950 px-3 text-content-subtle">
                  Atau mode testing
                </span>
              </div>
            </div>

            {!showTestForm ? (
              <Button
                variant="secondary"
                onClick={() => setShowTestForm(true)}
                className="w-full"
                disabled={loading}
              >
                Test User
              </Button>
            ) : (
              <form onSubmit={handleTestLogin} className="space-y-4" noValidate>
                <div>
                  <Label
                    htmlFor="email"
                    className="text-label-md text-content dark:text-content"
                  >
                    Email
                  </Label>
                  <TextInput
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="email"
                    placeholder="nama@kretya.com"
                    className="mt-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="password"
                    className="text-label-md text-content dark:text-content"
                  >
                    Password
                  </Label>
                  <TextInput
                    type="password"
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="mt-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowTestForm(false)}
                    disabled={loading}
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? "Loading..." : "Masuk"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
