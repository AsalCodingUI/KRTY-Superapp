"use client"

import { AlwaysDark } from "@/components/always-dark"
import { AppIcon } from "@/components/app-icon"
import { createClient } from "@/shared/api/supabase/client"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { m, useReducedMotion, type Variants } from "motion/react"
import { useEffect, useState } from "react"

const EASE = [0.23, 1, 0.32, 1] as const

/** The column reveals its parts one after another. */
const STAGGER: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.12, staggerChildren: 0.09 } },
}

/** The icon: out of a blur, a little small and tilted, settling on a spring. */
const ICON: Variants = {
  hidden: { opacity: 0, scale: 0.72, rotate: -8, filter: "blur(10px)" },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    filter: "blur(0px)",
    transitionEnd: { filter: "none" },
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      opacity: { duration: 0.35, ease: EASE },
      filter: { duration: 0.45, ease: EASE },
    },
  },
}

/** The glow blooms in behind the icon, a beat later and slower. */
const GLOW: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.2, duration: 1, ease: EASE },
  },
}

/** Text and controls rise a few pixels out of a soft blur. */
const RISE: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transitionEnd: { filter: "none" },
    transition: { duration: 0.6, ease: EASE },
  },
}

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
 * Sign in: the app icon popping in with its glow, one large heading, and a
 * single pill to continue with Google, each rising in turn. One narrow
 * column in the middle of an empty page.
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
    <AlwaysDark>
      <main className="text-foreground grid min-h-dvh grid-rows-[1fr_auto_1fr_1.5rem] justify-items-center bg-white px-4 dark:bg-black">
        <m.div
          className="row-start-2 flex w-full max-w-[360px] flex-col items-center pt-4 pb-16"
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={STAGGER}
        >
          {/* The icon pops in (spring, out of a blur); its glow blooms behind
              it. The icon is cut to a squircle by a mask, so the glow lives on
              its own layer where the mask can't clip it. */}
          <m.div className="relative size-[88px]" variants={ICON}>
            <m.span
              aria-hidden
              variants={GLOW}
              className="absolute inset-0 rounded-[28px] shadow-[32px_0_100px_0_rgba(160,104,251,0.15),-32px_0_100px_0_rgba(106,253,216,0.15),0_-32px_100px_0_rgba(133,187,249,0.15),0_32px_100px_0_rgba(251,107,130,0.15)]"
            />
            <AppIcon size={1024} className="squircle-mask relative size-full" />
          </m.div>

          <m.h1
            variants={RISE}
            className="font-heading text-heading mt-11 text-center text-[30px] leading-[1.1] font-medium tracking-[-0.03em] text-balance"
          >
            {t("loginTitle")}
          </m.h1>

          <div className="mt-6 flex w-full flex-col gap-4">
            {error && (
              <p
                role="alert"
                className="bg-destructive-subtle text-destructive rounded-xl px-4 py-3 text-center text-[13px]"
              >
                {error}
              </p>
            )}

            <m.button
              variants={RISE}
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className={cn(
                "flex h-11 w-full cursor-pointer items-center justify-center gap-2.5 rounded-full text-sm font-medium",
                // A white pill on a hairline ring; only the press eases.
                "text-foreground bg-background shadow-[0_4px_8px_-2px_rgb(0_0_0/0.03),0_2px_4px_-1px_rgb(0_0_0/0.03),0_0_0_1px_rgb(0_0_0/0.07)] hover:bg-[color-mix(in_oklch,var(--foreground)_2%,var(--background))]",
                "dark:bg-white/[0.06] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)] dark:hover:bg-white/10",
                "outline-none focus-visible:ring-[3px] focus-visible:ring-(--focus-ring) disabled:pointer-events-none disabled:opacity-60",
              )}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? <Spinner className="size-4" /> : <GoogleMark />}
              <span>
                {loading ? t("loginConnecting") : t("loginWithGoogle")}
              </span>
            </m.button>

            <m.p
              variants={RISE}
              className="text-muted-foreground text-center text-[13px] text-balance"
            >
              {t("loginSubtitle")}
            </m.p>
          </div>
        </m.div>
      </main>
    </AlwaysDark>
  )
}
