"use client"

import { glassSurfaceClass, GlassLayer } from "@/components/minimal-screen"
import {
  answerBriefOffer,
  deleteBriefFile,
  saveBriefAnswers,
  submitBrief,
} from "@/app/(fullscreen)/b/[token]/actions"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { ProjectStageIcon } from "@/page-slices/projects/ui/ProjectStageIcon"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  briefProgress,
  fileSize,
  visibleSections,
  type BriefFileRef,
} from "@/shared/lib/briefs/brief"
import { SET_OFFERS } from "@/shared/lib/briefs/templates"
import {
  BRIEF_FILE_MAX,
  BRIEF_SETS,
  type BriefAnswers,
  type BriefQuestion,
  type BriefSection,
  type BriefSet,
} from "@/shared/lib/briefs/types"
import {
  Check,
  CircleAlert,
  CloudUpload,
  FileIcon,
  X,
} from "@/components/icons"
import { LazyMotion, m } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"
import type * as React from "react"
import { BriefField } from "./fields"
import {
  ChoiceHint,
  briefTitleClass,
  glassFieldClass,
  questionHelpClass,
  questionLabelClass,
  RequiredMark,
  sectionTitleClass,
} from "./brief-ui"

export type BriefFormData = {
  token: string
  title: string
  clientName: string | null
  sections: BriefSection[]
  sets: string[]
  offers: string[]
  declined: string[]
  /** Offers the client took (they can drop them again). */
  accepted: string[]
  answers: BriefAnswers
  files: BriefFileRef[]
  savedAt: string | null
  submitted: boolean
}

/** Short names for the extras, in the client's words. */
const EXTRA_NAMES: Record<BriefSet, string> = {
  design: "UI design",
  branding: "Branding",
  development: "Development",
}

type SaveState = "idle" | "saving" | "saved" | "error"
type Upload = {
  key: string
  name: string
  size: number
  progress: number
  error?: string
}

const SAVE_DELAY = 700

/** One easing for the screens: the logo glides up, the rest settles in. */
const GLIDE = { type: "spring", bounce: 0.12, duration: 0.6 } as const
// Shared-layout motion (the logo moving) loads only on this page.
const loadLayoutFeatures = () =>
  import("@/components/providers/motion-features-max").then(
    (mod) => mod.default,
  )
const localKey = (token: string) => `krty-brief:${token}`

/**
 * The client's side of a brief (client site, no account), one section at
 * a time in a card that fills the screen: a welcome, the sections (Next
 * checks that one's required answers), a last look with the offers, and
 * a thank-you. Every change is
 * kept twice: in this browser right away (closing the laptop mid-answer
 * loses nothing) and on the server a moment later; coming back picks up
 * where they were. Submitting tells the team; answers stay editable.
 */
export function BriefForm({
  data,
  logo,
  names,
}: {
  data: BriefFormData
  /** The studio's logo (it glides from the start screen to the top). */
  logo: React.ReactNode
  /** "Kretya Studio" and the client, under the logo once they've started. */
  names: React.ReactNode
}) {
  const { token } = data
  const [answers, setAnswers] = useState<BriefAnswers>(data.answers)
  const [sets, setSets] = useState(data.sets)
  const [offers, setOffers] = useState(data.offers)
  const [declined, setDeclined] = useState(data.declined)
  const [accepted, setAccepted] = useState(data.accepted)
  const [files, setFiles] = useState(data.files)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [save, setSave] = useState<SaveState>(data.savedAt ? "saved" : "idle")
  const [submitted, setSubmitted] = useState(data.submitted)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMissing, setShowMissing] = useState(false)

  const latest = useRef(answers)
  const dirty = useRef(false)
  const timer = useRef<number | undefined>(undefined)
  const inFlight = useRef<Promise<void> | null>(null)

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current)
    if (!dirty.current) return
    if (inFlight.current) await inFlight.current
    dirty.current = false
    setSave("saving")
    const run = (async () => {
      const result = await saveBriefAnswers(token, latest.current).catch(
        () => null,
      )
      if (result?.ok) {
        setSave("saved")
      } else {
        // Offline or a hiccup: keep it marked and try again soon.
        dirty.current = true
        setSave("error")
        timer.current = window.setTimeout(() => void flush(), 5000)
      }
    })()
    inFlight.current = run
    await run
    inFlight.current = null
  }, [token])

  const change = (next: BriefAnswers) => {
    latest.current = next
    dirty.current = true
    setAnswers(next)
    try {
      localStorage.setItem(
        localKey(token),
        JSON.stringify({ answers: next, at: new Date().toISOString() }),
      )
    } catch {}
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void flush(), SAVE_DELAY)
  }
  const set = (id: string, value: string | string[]) =>
    change({ ...latest.current, [id]: value })

  // Back after closing the tab or going offline: this browser's copy wins
  // when it's newer than the server's.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(localKey(token))
      if (!raw) return
      const local = JSON.parse(raw) as { answers: BriefAnswers; at: string }
      if (!data.savedAt || local.at > data.savedAt) change(local.answers)
    } catch {}
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Leaving, hiding the tab or coming back online: save now.
  useEffect(() => {
    const now = () => void flush()
    const hidden = () => document.visibilityState === "hidden" && now()
    window.addEventListener("online", now)
    window.addEventListener("pagehide", now)
    document.addEventListener("visibilitychange", hidden)
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => {
      window.removeEventListener("online", now)
      window.removeEventListener("pagehide", now)
      document.removeEventListener("visibilitychange", hidden)
      window.removeEventListener("beforeunload", warn)
    }
  }, [flush])

  const shown = visibleSections(data.sections, sets, { answers })
  const progress = briefProgress(data.sections, sets, answers, files)
  const missing = new Set(progress.missing.map((q) => q.id))

  // An extra the team offered: taken, or not. Either can be undone; the
  // answers to a dropped extra stay saved in case it comes back.
  const takeOffer = async (offer: string, yes: boolean) => {
    const before = { sets, offers, declined, accepted }
    const without = (list: string[]) => list.filter((s) => s !== offer)
    const nextSets = yes
      ? [...without(sets), offer]
      : accepted.includes(offer)
        ? without(sets)
        : sets
    setOffers(without(offers))
    setDeclined(yes ? without(declined) : [...without(declined), offer])
    setAccepted(yes ? [...without(accepted), offer] : without(accepted))
    setSets(nextSets)
    const result = await answerBriefOffer(token, offer, yes).catch(() => null)
    if (!result?.ok) {
      setSets(before.sets)
      setOffers(before.offers)
      setDeclined(before.declined)
      setAccepted(before.accepted)
      setError(result?.error ?? "Couldn't save that. Please try again.")
      return null
    }
    setError(null)
    return visibleSections(data.sections, nextSets, {
      answers: latest.current,
    })
  }

  const upload = (questionId: string, picked: FileList | null) => {
    for (const file of Array.from(picked ?? [])) {
      const key = `${file.name}-${file.size}-${Math.random()}`
      if (file.size > BRIEF_FILE_MAX) {
        setUploads((u) => [
          ...u,
          {
            key,
            name: file.name,
            size: file.size,
            progress: 0,
            error: "Over 200 MB",
          },
        ])
        continue
      }
      setUploads((u) => [
        ...u,
        { key, name: file.name, size: file.size, progress: 0 },
      ])
      const xhr = new XMLHttpRequest()
      xhr.open("POST", `/b/${token}/upload`)
      xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name))
      xhr.setRequestHeader("x-question-id", questionId)
      xhr.setRequestHeader(
        "content-type",
        file.type || "application/octet-stream",
      )
      xhr.upload.onprogress = (e) =>
        e.lengthComputable &&
        setUploads((u) =>
          u.map((x) =>
            x.key === key ? { ...x, progress: e.loaded / e.total } : x,
          ),
        )
      const done = (message?: string) =>
        setUploads((u) =>
          message
            ? u.map((x) => (x.key === key ? { ...x, error: message } : x))
            : u.filter((x) => x.key !== key),
        )
      xhr.onload = () => {
        const body = (() => {
          try {
            return JSON.parse(xhr.responseText) as {
              file?: BriefFileRef
              error?: string
            }
          } catch {
            return {}
          }
        })()
        if (xhr.status === 200 && body.file) {
          setFiles((f) => [...f, body.file!])
          done()
        } else done(body.error ?? "Upload failed")
      }
      xhr.onerror = () => done("Upload failed. Check your connection.")
      xhr.send(file)
    }
  }

  const removeFile = async (file: BriefFileRef) => {
    setFiles((f) => f.filter((x) => x.id !== file.id))
    const result = await deleteBriefFile(token, file.id).catch(() => null)
    if (!result?.ok) setFiles((f) => [...f, file])
  }

  // Where they are: the welcome (-1), a section (0…n-1), the last check (n).
  // Remembered on this device, so coming back opens the same place.
  const stepKey = `${localKey(token)}:step`
  const [step, setStepState] = useState(-1)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(stepKey)
      const saved = raw === null ? NaN : Number(raw)
      if (Number.isInteger(saved) && saved >= 0) setStepState(saved)
    } catch {}
  }, [stepKey])
  const body = useRef<HTMLDivElement>(null)
  const goTo = (next: number) => {
    setStepState(next)
    setShowMissing(false)
    body.current?.scrollTo({ top: 0 })
    try {
      localStorage.setItem(stepKey, String(next))
    } catch {}
  }
  const last = shown.length
  // Extras the team offered, whatever the client did with them.
  const extras = BRIEF_SETS.filter(
    (x) =>
      data.sections.some((sec) => sec.set === x) &&
      (offers.includes(x) || accepted.includes(x) || declined.includes(x)),
  )
  // How many steps an extra adds (gone once it's dropped).
  const extraSteps = (x: string) => shown.filter((sec) => sec.set === x).length
  const current = step >= 0 && step < last ? shown[step] : null
  const missingIn = (section: BriefSection) =>
    section.questions.filter((q) => missing.has(q.id))

  const next = () => {
    if (current) {
      const open = missingIn(current)
      if (open.length) {
        setShowMissing(true)
        document
          .getElementById(`q-${open[0].id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
        return
      }
    }
    void flush()
    goTo(Math.min(step + 1, last))
  }

  const send = async () => {
    await flush()
    const firstOpen = shown.findIndex((s) => missingIn(s).length)
    if (firstOpen >= 0) {
      goTo(firstOpen)
      setShowMissing(true)
      return
    }
    setSending(true)
    setError(null)
    const result = await submitBrief(token, latest.current).catch(() => null)
    setSending(false)
    if (!result?.ok) {
      setError(result?.error ?? "Couldn't send it. Please try again.")
      return
    }
    dirty.current = false
    setSubmitted(true)
    goTo(-1)
  }

  const questionCount = shown.reduce(
    (n, s) =>
      n +
      s.questions.filter((q) => q.type !== "divider" && q.type !== "statement")
        .length,
    0,
  )
  const minutes = Math.max(3, Math.round(questionCount * 0.4))
  const uploading = uploads.some((u) => !u.error)
  const started = step >= 0

  return (
    <LazyMotion features={loadLayoutFeatures}>
      <m.div
        data-translate-root
        // The card morphs between the start (small, hugging) and the
        // questions (full height): its size animates both ways. Between
        // steps it just takes the new size, so the footer doesn't bob.
        layout
        layoutDependency={started}
        transition={GLIDE}
        style={{ borderRadius: 24 }}
        className={cn(
          // A touch see-through, frosted, so the backdrop shows.
          glassSurfaceClass,
          "z-10 mx-auto flex w-full flex-col",
          // The card hugs its content (the start smaller), up to the screen's
          // height, then the questions scroll inside it.
          "my-auto max-h-full",
          step < 0 ? "max-w-lg" : "max-w-3xl",
        )}
      >
        <GlassLayer />
        {step >= 0 && (
          <m.div
            layout="position"
            layoutDependency={started}
            transition={GLIDE}
            className="border-border flex shrink-0 flex-col items-center gap-6 border-b px-6 pt-8 pb-6 sm:px-10"
          >
            <div className="flex flex-col items-center gap-3 text-center">
              <m.div
                layoutId="brief-logo"
                layoutDependency={started}
                transition={GLIDE}
              >
                {logo}
              </m.div>
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...GLIDE, delay: 0.1 }}
              >
                {names}
              </m.div>
            </div>
            <m.div
              className="w-full"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...GLIDE, delay: 0.12 }}
            >
              <Stepper
                sections={shown}
                step={step}
                onPick={(i) => i < step && goTo(i)}
                status={<SaveBadge state={save} />}
              />
            </m.div>
          </m.div>
        )}

        <m.div
          layout="position"
          layoutDependency={started}
          transition={GLIDE}
          ref={body}
          className={cn(
            "scroll-pane pane-px-6 sm:pane-px-10",
            // Its content's height, shrinking (and scrolling) once the card
            // reaches the screen's height.
            step >= 0 && "min-h-0 flex-auto",
          )}
        >
          <div
            className={cn(
              "flex w-full flex-col gap-8",
              step < 0 ? "py-14 sm:py-16" : "py-10",
            )}
          >
            {step < 0 ? (
              // The start (or the thank-you): everything centered in the card.
              <m.div
                key={submitted ? "thanks" : "start"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={GLIDE}
                className="mx-auto flex max-w-md flex-col items-center gap-6 text-center"
              >
                {submitted ? (
                  <span className="bg-muted flex size-12 items-center justify-center rounded-full">
                    <Check className="size-5" />
                  </span>
                ) : (
                  <m.div
                    layoutId="brief-logo"
                    layoutDependency={started}
                    transition={GLIDE}
                  >
                    {logo}
                  </m.div>
                )}
                <div className="flex flex-col items-center gap-3">
                  <h1 className={briefTitleClass}>
                    {submitted
                      ? `Thank you${data.clientName ? `, ${data.clientName}` : ""}!`
                      : data.title}
                  </h1>
                  <p className="text-muted-foreground text-title leading-relaxed">
                    {submitted
                      ? "Your answers are with our team. We’ll go through them and get back to you soon."
                      : `${data.clientName ? `Hi ${data.clientName}! ` : "Hi! "}A few questions so we understand what you need before we start.`}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Button
                    size="lg"
                    variant={submitted ? "outline" : "default"}
                    className="px-6"
                    onClick={() => goTo(0)}
                  >
                    {submitted
                      ? "Edit my answers"
                      : data.savedAt
                        ? "Continue"
                        : "Start"}
                  </Button>
                  <p
                    className="text-tertiary-foreground flex flex-wrap items-center justify-center gap-x-1.5 text-xs"
                    data-no-translate={submitted ? undefined : true}
                  >
                    {submitted ? (
                      "Changes save as you go."
                    ) : (
                      <>
                        <span>
                          {last} {last === 1 ? "section" : "sections"}
                        </span>
                        <span aria-hidden>·</span>
                        <span>About {minutes} min</span>
                        <span aria-hidden>·</span>
                        <span>Saves as you go</span>
                      </>
                    )}
                  </p>
                </div>
              </m.div>
            ) : current ? (
              <m.section
                key={`step-${step}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...GLIDE, delay: 0.08 }}
                className="flex flex-col gap-8"
              >
                <div className="flex flex-col gap-1">
                  {accepted.includes(current.set) && (
                    <div className="dark:bg-field rounded-card mb-4 flex h-12 items-center gap-3 bg-white/35 pr-1.5 pl-4 text-sm">
                      <ProjectStageIcon
                        stage={current.set as BriefSet}
                        className="size-4 shrink-0"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {EXTRA_NAMES[current.set as BriefSet]}
                        <span className="text-muted-foreground">
                          {" "}
                          · An extra you added
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        className="text-muted-foreground shrink-0"
                        onClick={async () => {
                          if (await takeOffer(current.set, false))
                            goTo(last - extraSteps(current.set))
                        }}
                      >
                        <X data-icon="inline-start" />
                        Remove
                      </Button>
                    </div>
                  )}
                  <h2 className={sectionTitleClass}>{current.title}</h2>
                  {current.description && (
                    <p className="text-muted-foreground text-sm">
                      {current.description}
                    </p>
                  )}
                </div>
                {current.questions.map((q) => (
                  <Question
                    key={q.id}
                    question={q}
                    answers={answers}
                    onChange={set}
                    flagged={showMissing && missing.has(q.id)}
                    files={files.filter((f) => f.question_id === q.id)}
                    uploads={uploads}
                    onUpload={(list) => upload(q.id, list)}
                    onRemoveFile={(f) => void removeFile(f)}
                    onDismissUpload={(key) =>
                      setUploads((u) => u.filter((x) => x.key !== key))
                    }
                  />
                ))}
              </m.section>
            ) : (
              <m.section
                key="review"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={GLIDE}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-1">
                  <h2 className={sectionTitleClass}>Almost done</h2>
                  <p className="text-muted-foreground text-sm">
                    A last look before it goes to our team.
                  </p>
                </div>
                <ol className="flex flex-col">
                  {shown.map((section, i) => {
                    const open = missingIn(section).length
                    return (
                      <li key={section.id}>
                        <button
                          type="button"
                          onClick={() => goTo(i)}
                          className="hover:bg-muted rounded-row -mx-3 flex w-[calc(100%+1.5rem)] items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors"
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full",
                              open
                                ? "border-field-border border"
                                : "bg-foreground text-background",
                            )}
                          >
                            {!open && (
                              <Check className="size-3" strokeWidth={3} />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {section.title}
                          </span>
                          {open > 0 && (
                            <span className="text-destructive-ink shrink-0 text-xs">
                              {open} to answer
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ol>
                {extras.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {extras.map((extra) => {
                      const pitch = SET_OFFERS[extra]
                      const name = EXTRA_NAMES[extra]
                      const state = accepted.includes(extra)
                        ? "added"
                        : declined.includes(extra)
                          ? "skipped"
                          : "offered"
                      const first = shown.findIndex((x) => x.set === extra)
                      const toAnswer = shown
                        .filter((x) => x.set === extra)
                        .reduce((n, x) => n + missingIn(x).length, 0)
                      return (
                        <div
                          key={extra}
                          className={cn(
                            "border-border rounded-card flex flex-col gap-3 border p-4 sm:flex-row sm:items-center",
                            state === "skipped" && "border-dashed",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/45 dark:bg-white/[0.06]",
                              state === "skipped" && "opacity-60",
                            )}
                          >
                            <ProjectStageIcon
                              stage={extra}
                              className="size-5"
                            />
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <p className="text-sm font-medium">
                              {state === "added"
                                ? `${name} added`
                                : state === "skipped"
                                  ? `${name}: not needed`
                                  : pitch.title}
                            </p>
                            <p className="text-muted-foreground text-meta">
                              {state === "added"
                                ? toAnswer
                                  ? `${toAnswer} question${toAnswer > 1 ? "s" : ""} left to answer.`
                                  : "All answered. Not needed after all? Remove it, your answers stay saved."
                                : state === "skipped"
                                  ? "Changed your mind? You can still add it."
                                  : pitch.body}
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            {state === "offered" && (
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => void takeOffer(extra, false)}
                              >
                                Not now
                              </Button>
                            )}
                            {state === "added" && (
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={() => void takeOffer(extra, false)}
                              >
                                Remove
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="lg"
                              className={glassFieldClass}
                              onClick={async () => {
                                if (state === "added") return goTo(first)
                                const next = await takeOffer(extra, true)
                                // Straight to its first question.
                                const at =
                                  next?.findIndex((x) => x.set === extra) ?? -1
                                if (at >= 0) goTo(at)
                              }}
                            >
                              {state === "added"
                                ? toAnswer
                                  ? "Answer"
                                  : "Edit answers"
                                : state === "skipped"
                                  ? "Add it"
                                  : "Yes, add it"}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {error && <FieldError>{error}</FieldError>}
              </m.section>
            )}
          </div>
        </m.div>

        {step >= 0 && (
          <m.footer
            layout="position"
            layoutDependency={started}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...GLIDE, delay: 0.16 }}
            className="border-border flex h-20 shrink-0 items-center gap-3 border-t px-6 sm:px-10"
            data-no-translate
          >
            {step >= 0 && (
              <Button variant="ghost" size="lg" onClick={() => goTo(step - 1)}>
                Back
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {current ? (
                <Button size="lg" onClick={next}>
                  {step === last - 1 ? "Review" : "Next"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  disabled={sending || uploading}
                  onClick={() => void send()}
                >
                  {sending && <Spinner data-icon="inline-start" />}
                  {submitted ? "Send the update" : "Send to Kretya Studio"}
                </Button>
              )}
            </div>
          </m.footer>
        )}
      </m.div>
    </LazyMotion>
  )
}

/**
 * Where they are: "Step 2 of 4" over one segment per section (done: solid, this one: half, ahead: faint). Earlier
 * segments go back to that section.
 */
function Stepper({
  sections,
  step,
  onPick,
  status,
}: {
  sections: BriefSection[]
  step: number
  onPick: (index: number) => void
  /** Right of "Step 2 of 4": whether the answers are saved. */
  status?: React.ReactNode
}) {
  const review = step >= sections.length
  return (
    <div className="flex flex-col gap-2.5" data-no-translate>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-meta tabular-nums">
          {review ? "Review" : `Step ${step + 1} of ${sections.length}`}
        </span>
        {status}
      </div>
      <div className="flex gap-1.5">
        {sections.map((section, i) => (
          <button
            key={section.id}
            type="button"
            title={section.title}
            aria-label={section.title}
            aria-current={i === step ? "step" : undefined}
            disabled={i >= step}
            onClick={() => onPick(i)}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300 enabled:cursor-pointer",
              i < step || review
                ? "bg-foreground enabled:hover:bg-foreground/70"
                : i === step
                  ? "bg-foreground/45"
                  : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  )
}

function SaveBadge({ state }: { state: SaveState }) {
  if (state === "idle") return null
  return (
    <span
      className={cn(
        "text-meta flex shrink-0 items-center gap-1.5",
        state === "error" ? "text-warning-ink" : "text-muted-foreground",
      )}
      aria-live="polite"
    >
      {state === "saving" ? (
        <Spinner className="size-3.5" />
      ) : state === "saved" ? (
        <Check className="size-3.5" />
      ) : (
        <CircleAlert className="size-3.5" />
      )}
      {state === "saving"
        ? "Saving…"
        : state === "saved"
          ? "Saved"
          : "Saved on this device"}
    </span>
  )
}

function Question({
  question: q,
  answers,
  onChange,
  flagged,
  files,
  uploads,
  onUpload,
  onRemoveFile,
  onDismissUpload,
}: {
  question: BriefQuestion
  answers: BriefAnswers
  onChange: (id: string, value: string | string[]) => void
  flagged: boolean
  files: BriefFileRef[]
  uploads: Upload[]
  onUpload: (files: FileList | null) => void
  onRemoveFile: (file: BriefFileRef) => void
  onDismissUpload: (key: string) => void
}) {
  const fieldId = `q-${q.id}`

  // Layout blocks: a paragraph, or a line between groups of questions.
  if (q.type === "divider") return <hr className="border-border" />
  if (q.type === "statement")
    return (
      <p className="text-muted-foreground text-title leading-relaxed whitespace-pre-wrap">
        {q.label}
      </p>
    )

  return (
    <div id={fieldId} className="flex scroll-mt-24 flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <label htmlFor={`${fieldId}-input`} className={questionLabelClass}>
          {q.label}
          {!q.optional && <RequiredMark />}
        </label>
        {q.help && <p className={questionHelpClass}>{q.help}</p>}
        {(q.type === "single" || q.type === "multi") && (
          <ChoiceHint multi={q.type === "multi"} />
        )}
      </div>

      {q.type !== "files" && (
        <BriefField
          question={q}
          answers={answers}
          onChange={onChange}
          flagged={flagged}
          inputId={`${fieldId}-input`}
        />
      )}
      {q.type === "files" && (
        <div className="flex flex-col gap-2">
          <FileDrop
            inputId={`${fieldId}-input`}
            flagged={flagged}
            onFiles={onUpload}
          />
          {[
            ...files.map((f) => ({ kind: "file" as const, f })),
            ...uploads.map((u) => ({ kind: "upload" as const, u })),
          ].map((item) =>
            item.kind === "file" ? (
              <div
                key={item.f.id}
                className="bg-muted rounded-card flex items-center gap-3 px-3 py-2 text-sm"
                data-no-translate
              >
                <FileIcon className="text-muted-foreground size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.f.name}</span>
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {fileSize(item.f.file_size)}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground -mr-1.5"
                  aria-label={`Remove ${item.f.name}`}
                  onClick={() => onRemoveFile(item.f)}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <div
                key={item.u.key}
                className="bg-muted rounded-card relative flex items-center gap-3 overflow-hidden px-3 py-2 text-sm"
                data-no-translate
              >
                {!item.u.error && (
                  <div
                    className="bg-primary/10 absolute inset-y-0 left-0 transition-[width]"
                    style={{ width: `${Math.round(item.u.progress * 100)}%` }}
                  />
                )}
                {item.u.error ? (
                  <CircleAlert className="text-destructive-ink relative size-4 shrink-0" />
                ) : (
                  <Spinner className="relative size-4 shrink-0" />
                )}
                <span className="relative min-w-0 flex-1 truncate">
                  {item.u.name}
                </span>
                <span
                  className={cn(
                    "relative shrink-0 text-xs tabular-nums",
                    item.u.error
                      ? "text-destructive-ink"
                      : "text-muted-foreground",
                  )}
                >
                  {item.u.error ?? `${Math.round(item.u.progress * 100)}%`}
                </span>
                {item.u.error && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground relative -mr-1.5"
                    aria-label="Dismiss"
                    onClick={() => onDismissUpload(item.u.key)}
                  >
                    <X />
                  </Button>
                )}
              </div>
            ),
          )}
        </div>
      )}
      {flagged && <FieldError>This one needs an answer.</FieldError>}
    </div>
  )
}

/**
 * The upload area: click to choose, or drop files on it. While files are
 * dragged over it, it lights up and says so.
 */
function FileDrop({
  inputId,
  flagged,
  onFiles,
}: {
  inputId: string
  flagged: boolean
  onFiles: (files: FileList | null) => void
}) {
  const [over, setOver] = useState(false)
  // dragenter / dragleave fire for every child; count them.
  const depth = useRef(0)
  const hasFiles = (e: React.DragEvent) =>
    e.dataTransfer.types.includes("Files")
  return (
    <label
      className={cn(
        "rounded-popover flex cursor-pointer flex-col items-center gap-1.5 border-[1.5px] border-dashed px-4 py-8 text-center transition-[border-color,background-color,transform] duration-200",
        over
          ? "border-foreground/70 bg-foreground/10 ring-foreground/10 scale-[1.01] ring-4"
          : "border-field-border hover:border-foreground/30 hover:bg-field-hover",
        flagged && !over && "border-destructive/50",
      )}
      onDragEnter={(e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        depth.current++
        setOver(true)
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "copy"
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1)
        if (!depth.current) setOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        depth.current = 0
        setOver(false)
        onFiles(e.dataTransfer.files)
      }}
    >
      <CloudUpload
        className={cn(
          "size-5 transition-[transform,color] duration-200 ease-out",
          over
            ? "text-foreground -translate-y-1 scale-125"
            : "text-muted-foreground",
        )}
      />
      <span className="pointer-events-none text-sm">
        {over ? "Drop to upload" : "Drop files here or click to choose"}
      </span>
      <span className="text-muted-foreground pointer-events-none text-xs">
        Single files or a ZIP · up to 200 MB each · kept exactly as sent
      </span>
      <input
        id={inputId}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </label>
  )
}
