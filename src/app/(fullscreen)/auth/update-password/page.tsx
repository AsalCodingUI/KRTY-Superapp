"use client"

import { AppIcon } from "@/components/app-icon"
import {
  glassControlClass,
  MinimalCard,
  MinimalScreen,
  screenLogoClass,
  screenTitleClass,
} from "@/components/minimal-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
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
    <MinimalScreen>
      <MinimalCard>
        <AppIcon size={192} className={screenLogoClass} />
        <h1 className={screenTitleClass}>{t("updatePasswordTitle")}</h1>

        <form
          onSubmit={handleUpdatePassword}
          className="flex w-full flex-col gap-4 text-left"
        >
          {success && (
            <div className="bg-success-subtle text-green-11 rounded-xl px-4 py-3 text-sm">
              {t("updatePasswordSuccess")}
            </div>
          )}
          {error && (
            <div className="bg-destructive-subtle text-red-11 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t("newPassword")}</Label>
            <Input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn("h-11 px-4", glassControlClass)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
            <Input
              type="password"
              id="confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              placeholder="••••••••"
              className={cn("h-11 px-4", glassControlClass)}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-2 w-full"
            disabled={loading || success}
          >
            {loading ? t("updatingPassword") : t("updatePassword")}
          </Button>
        </form>

        <p className="text-muted-foreground text-sm">
          {t("rememberPassword")}{" "}
          <a href="/login" className="text-foreground underline">
            {t("signIn")}
          </a>
        </p>
      </MinimalCard>
    </MinimalScreen>
  )
}
