"use client"

import { AppIcon } from "@/components/app-icon"
import {
  MinimalCard,
  MinimalScreen,
  screenLogoClass,
  screenTextClass,
  screenTitleClass,
} from "@/components/minimal-screen"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useT } from "@/shared/i18n/client"
import { ARRIVAL, DURATION, EASE_OUT, TRANSITION } from "@/shared/lib/motion"
import { AnimatePresence, m, useAnimate, useReducedMotion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { unlockPortal } from "./actions"

const LENGTH = 6

/** A code box: see-through on the frosted card, like its fields. */
const BOX_SURFACE = "bg-white/35 dark:bg-field"

/**
 * The portal's door, on the minimal screens' card like sign in: the app
 * icon, the project's name, and six code boxes. The sixth digit sends it; a wrong PIN
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
        { duration: 0.45, ease: EASE_OUT },
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
    <MinimalScreen>
      <MinimalCard>
        <m.form
          onSubmit={(e) => {
            e.preventDefault()
            void submit(pin)
          }}
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
            <h1 className={screenTitleClass}>{projectName}</h1>
            <p className={screenTextClass}>{t("portalPinPrompt")}</p>
          </m.div>

          <m.div variants={ARRIVAL.rise} className="w-full">
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
                      BOX_SURFACE,
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
                            transition: TRANSITION,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.6,
                            transition: {
                              duration: DURATION.fast,
                              ease: EASE_OUT,
                            },
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
                    className="text-muted-foreground text-meta flex items-center gap-2"
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
                    className="text-destructive-ink text-meta"
                  >
                    {error}
                  </m.p>
                ) : null}
              </AnimatePresence>
            </div>
          </m.div>
        </m.form>
      </MinimalCard>
    </MinimalScreen>
  )
}
