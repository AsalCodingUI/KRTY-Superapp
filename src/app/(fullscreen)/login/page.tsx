"use client"

import { AppIcon } from "@/components/app-icon"
import {
  glassControlClass,
  MinimalCard,
  MinimalScreen,
  screenLogoClass,
  screenTextClass,
  screenTitleClass,
} from "@/components/minimal-screen"
import { Button } from "@/components/ui/button"
import { createClient } from "@/shared/api/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { ARRIVAL } from "@/shared/lib/motion"
import { m, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"

/** Google's "G" mark, as on every Google sign-in button. */
function GoogleMark() {
  return (
    <svg aria-hidden width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path
        d="M15.83 8.18c0-.53-.05-1.03-.13-1.51H8.17v3h4.31a3.7 3.7 0 0 1-1.6 2.39v2h2.58c1.5-1.39 2.37-3.45 2.37-5.88Z"
        fill="#4285F4"
      />
      <path
        d="M8.17 16c2.16 0 3.97-.72 5.29-1.94l-2.58-2c-.72.48-1.63.77-2.71.77-2.09 0-3.85-1.4-4.49-3.3H1.03v2.06A8 8 0 0 0 8.17 16Z"
        fill="#34A853"
      />
      <path
        d="M3.68 9.53a4.8 4.8 0 0 1 0-3.06V4.41H1.03a8 8 0 0 0 0 7.18l2.65-2.06Z"
        fill="#FBBC05"
      />
      <path
        d="M8.17 3.17c1.18 0 2.23.4 3.07 1.2l2.28-2.28A7.7 7.7 0 0 0 8.17 0 8 8 0 0 0 1.03 4.41l2.65 2.06c.64-1.9 2.4-3.3 4.49-3.3Z"
        fill="#EA4335"
      />
    </svg>
  )
}

/** `?next=…` for the auth callback, when the login page was given one. */
function nextParam() {
  const next = new URLSearchParams(window.location.search).get("next")
  return next?.startsWith("/") && !next.startsWith("//")
    ? `?next=${encodeURIComponent(next)}`
    : ""
}

/**
 * Sign in: the app icon popping in, a heading, and one button to continue
 * with Google, each rising in turn, on the frosted card of the minimal
 * screens.
 */
export default function LoginPage() {
  const supabase = createClient()
  const t = useT("auth")
  const reduce = useReducedMotion()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // /auth/callback sends failed sign-ins back with ?error=… (read here, not
  // with useSearchParams, so the page needs no Suspense boundary).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("error")) {
      setError(t("loginGoogleFailed"))
    }
  }, [t])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // The page they were sent here from (?next=, set by the
          // middleware); the callback only accepts same-site paths.
          redirectTo: `${window.location.origin}/auth/callback${nextParam()}`,
        },
      })

      if (error) {
        throw error
      }

      // The redirect happens automatically via Supabase
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("loginGoogleFailed")
      setError(message)
      setLoading(false)
    }
  }

  return (
    <MinimalScreen>
      <MinimalCard>
        <m.div
          className="flex w-full flex-col items-center gap-6"
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={ARRIVAL.stagger}
        >
          <m.div variants={ARRIVAL.icon}>
            <AppIcon size={192} className={screenLogoClass} />
          </m.div>

          <m.div
            variants={ARRIVAL.rise}
            className="flex flex-col items-center gap-3"
          >
            <h1 className={screenTitleClass}>{t("loginTitle")}</h1>
            <p className={screenTextClass}>{t("loginSubtitle")}</p>
          </m.div>

          <m.div variants={ARRIVAL.rise} className="flex w-full flex-col gap-3">
            {error && (
              <p
                role="alert"
                className="bg-destructive-subtle text-red-11 text-meta rounded-xl px-4 py-3"
              >
                {error}
              </p>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={cn("w-full", glassControlClass)}
            >
              {loading ? <Spinner className="size-4" /> : <GoogleMark />}
              {loading ? t("loginConnecting") : t("loginWithGoogle")}
            </Button>
          </m.div>
        </m.div>
      </MinimalCard>
    </MinimalScreen>
  )
}
