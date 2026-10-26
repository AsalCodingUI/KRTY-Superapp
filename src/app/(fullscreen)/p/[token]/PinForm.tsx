"use client"

import { AppIcon } from "@/components/app-icon"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import {
  AnimatePresence,
  m,
  useAnimate,
  useReducedMotion,
  type Variants,
} from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { unlockPortal } from "./actions"

const LENGTH = 6
const EASE = [0.23, 1, 0.32, 1] as const

// Same entrance as the sign-in page: the column reveals its parts in turn.
const STAGGER: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.12, staggerChildren: 0.09 } },
}

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

const GLOW: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.2, duration: 1, ease: EASE },
  },
}

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

/** The hairline-ringed white surface the sign-in pill uses. */
const PILL_SURFACE =
  "bg-background shadow-[0_4px_8px_-2px_rgb(0_0_0/0.03),0_2px_4px_-1px_rgb(0_0_0/0.03),0_0_0_1px_rgb(0_0_0/0.07)] dark:bg-white/[0.06] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)]"

/**
 * The portal's door, dressed like the sign-in page: the app icon, the
 * project's name, and six code boxes. The sixth digit sends it; a wrong PIN
 * shakes the boxes and clears them.
 */
export function PinForm({
  token,
  projectName,
}: {
  token: string
  projectName: string
}) {
  const t = useT("projects")
  const router = useRouter()
  const reduce = useReducedMotion()
  const input = useRef<HTMLInputElement>(null)
  const [boxes, animate] = useAnimate<HTMLDivElement>()
  const [pin, setPin] = useState("")
  const [focused, setFocused] = useState(false)
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => input.current?.focus(), [])

  const submit = async (code: string) => {
    if (code.length !== LENGTH || busy) return
    setBusy(true)
    setError(null)
    // A dropped connection reads as a failed try, not a stuck spinner.
    const result = await unlockPortal(token, code).catch(
      () => ({ ok: false, reason: "network" }) as const,
    )
    if (result.ok) {
      setOk(true)
      router.refresh()
      return
    }
    setBusy(false)
    setError(
      result.reason === "locked"
        ? t("portalLocked")
        : result.reason === "missing"
          ? t("portalMissing")
          : result.reason === "network"
            ? t("portalTryAgain")
            : t("portalWrongPin"),
    )
    if (!reduce && boxes.current) {
      await animate(
        boxes.current,
        { x: [0, -10, 9, -7, 5, -2, 0] },
        { duration: 0.45, ease: "easeOut" },
      )
    }
    setPin("")
    // Focus once the input is enabled again (after this render).
    requestAnimationFrame(() => input.current?.focus())
  }

  const change = (value: string) => {
    const next = value.replace(/\D/g, "").slice(0, LENGTH)
    setPin(next)
    if (error) setError(null)
    if (next.length === LENGTH) void submit(next)
  }

  return (
    <main className="text-foreground grid min-h-dvh grid-rows-[1fr_auto_1fr_1.5rem] justify-items-center bg-white px-4 dark:bg-black">
      <m.form
        onSubmit={(e) => {
          e.preventDefault()
          void submit(pin)
        }}
        className="row-start-2 flex w-full max-w-[360px] flex-col items-center pt-4 pb-16"
        initial={reduce ? false : "hidden"}
        animate="show"
        variants={STAGGER}
      >
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
          {projectName}
        </m.h1>
        <m.p
          variants={RISE}
          className="text-muted-foreground mt-3 text-center text-sm text-balance"
        >
          {t("portalPinPrompt")}
        </m.p>

        <m.div variants={RISE} className="mt-8 w-full">
          {/* One real input over the six boxes: typing, paste, autofill
              and the phone's code suggestion all just work. */}
          <div
            ref={boxes}
            className="relative grid grid-cols-6 gap-2"
            onClick={() => input.current?.focus()}
          >
            <input
              ref={input}
              value={pin}
              onChange={(e) => change(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d*"
              maxLength={LENGTH}
              disabled={busy}
              aria-label={t("portalPin")}
              aria-invalid={Boolean(error) || undefined}
              className="absolute inset-0 z-10 size-full cursor-text opacity-0"
            />
            {Array.from({ length: LENGTH }, (_, i) => {
              const digit = pin[i]
              const current =
                focused && !busy && i === Math.min(pin.length, LENGTH - 1)
              return (
                <div
                  key={i}
                  className={cn(
                    "relative flex aspect-[5/6] items-center justify-center rounded-2xl text-2xl font-medium tabular-nums transition-[box-shadow,background-color] duration-200",
                    PILL_SURFACE,
                    current &&
                      "shadow-[0_0_0_1.5px_var(--primary),0_0_0_5px_color-mix(in_oklch,var(--primary)_18%,transparent)] dark:shadow-[0_0_0_1.5px_var(--primary),0_0_0_5px_color-mix(in_oklch,var(--primary)_25%,transparent)]",
                    error &&
                      "shadow-[0_0_0_1.5px_var(--destructive)] dark:shadow-[0_0_0_1.5px_var(--destructive)]",
                    ok &&
                      "bg-success-subtle shadow-[0_0_0_1.5px_var(--success)] dark:shadow-[0_0_0_1.5px_var(--success)]",
                  )}
                >
                  <AnimatePresence initial={false}>
                    {digit && (
                      <m.span
                        key={digit + i}
                        initial={
                          reduce
                            ? false
                            : {
                                opacity: 0,
                                y: 8,
                                scale: 0.6,
                                filter: "blur(4px)",
                              }
                        }
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          filter: "blur(0px)",
                          transition: {
                            type: "spring",
                            stiffness: 500,
                            damping: 28,
                          },
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.6,
                          transition: { duration: 0.12 },
                        }}
                        className="absolute"
                      >
                        {digit}
                      </m.span>
                    )}
                  </AnimatePresence>
                  {current && !digit && (
                    <span
                      aria-hidden
                      className="bg-foreground animate-caret-blink h-7 w-px"
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex h-5 items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
              {busy ? (
                <m.span
                  key="busy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-muted-foreground flex items-center gap-2 text-[13px]"
                >
                  <Spinner className="size-3.5" />
                  {t("portalOpen")}
                </m.span>
              ) : error ? (
                <m.p
                  key="error"
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-destructive text-[13px]"
                >
                  {error}
                </m.p>
              ) : null}
            </AnimatePresence>
          </div>
        </m.div>
      </m.form>
    </main>
  )
}
