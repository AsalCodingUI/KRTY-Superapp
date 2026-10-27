"use client"

import { AlwaysDark } from "@/components/always-dark"
import { AppIcon } from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/shared/api/supabase/client"
import { useT } from "@/shared/i18n/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const t = useT("auth")

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
      setError(t("passwordsMismatch"))
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
        err instanceof Error ? err.message : t("updatePasswordFailed")
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlwaysDark>
      <div className="flex min-h-screen flex-1 flex-col justify-center px-4 lg:px-6">
        <div className="mx-auto w-full max-w-sm">
          <AppIcon size={192} className="mx-auto size-12 rounded-xl" />
          <h1 className="text-foreground mt-6 text-center text-lg font-semibold">
            {t("updatePasswordTitle")}
          </h1>

          <div className="mt-6">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* Success Message */}
              {success && (
                <div className="bg-success/10 text-success ring-success/20 rounded-md p-3 text-sm ring-1 ring-inset">
                  {t("updatePasswordSuccess")}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-destructive/10 text-destructive ring-destructive/20 rounded-md p-3 text-sm ring-1 ring-inset">
                  {error}
                </div>
              )}

              <div>
                <Label
                  htmlFor="password"
                  className="text-foreground dark:text-foreground text-sm font-medium"
                >
                  {t("newPassword")}
                </Label>
                <Input
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
                  className="text-foreground dark:text-foreground text-sm font-medium"
                >
                  {t("confirmPassword")}
                </Label>
                <Input
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

              <Button
                type="submit"
                className="w-full"
                disabled={loading || success}
              >
                {loading ? t("updatingPassword") : t("updatePassword")}
              </Button>
            </form>

            <p className="text-tertiary-foreground mt-6 text-center text-sm">
              {t("rememberPassword")}{" "}
              <a
                href="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                {t("signIn")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </AlwaysDark>
  )
}
