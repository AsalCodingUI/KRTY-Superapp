"use client"

import { Button, Label, TextInput } from "@/components/ui"
import { createClient } from "@/shared/api/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      router.refresh()
      router.push("/dashboard")
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Login failed. Please check your email and password."
      setError(message)
    } finally {
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
          Welcome back! Please enter your details.
        </p>

        <div className="mt-6">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-danger-100 text-body-sm text-danger ring-danger-200 rounded-md p-3 ring-1 ring-inset">
                {error}
              </div>
            )}

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
                placeholder="name@kretya.com"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Masuk"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
