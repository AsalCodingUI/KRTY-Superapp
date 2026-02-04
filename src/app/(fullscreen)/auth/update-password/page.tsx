"use client"

import { Button, Label, TextInput } from "@/components/ui"
import { createClient } from "@/shared/api/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      // Redirect ke dashboard/login setelah 2 detik
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update password"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface flex min-h-screen flex-1 flex-col justify-center px-4 lg:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h3 className="text-heading-md text-content dark:text-content mt-6 text-center">
          Update your password
        </h3>
        <p className="text-body-sm text-content-muted mt-2 text-center">
          Please enter your new password below.
        </p>

        <div className="mt-6">
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            {/* Success Message */}
            {success && (
              <div className="bg-success/10 text-body-sm text-success ring-success/20 rounded-md p-3 ring-1 ring-inset">
                Password updated successfully! Redirecting...
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-danger/10 text-body-sm text-danger ring-danger/20 rounded-md p-3 ring-1 ring-inset">
                {error}
              </div>
            )}

            <div>
              <Label
                htmlFor="password"
                className="text-label-md text-content dark:text-content"
              >
                New Password
              </Label>
              <TextInput
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="mt-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div>
              <Label
                htmlFor="confirm-password"
                className="text-label-md text-content dark:text-content"
              >
                Confirm Password
              </Label>
              <TextInput
                type="password"
                id="confirm-password"
                name="confirm-password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="mt-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>

          <p className="text-body-sm text-content-muted mt-6 text-center">
            Remember your password?{" "}
            <a
              href="/login"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
